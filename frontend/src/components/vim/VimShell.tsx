"use client";
import { useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    COLORSCHEMES,
    applyColorscheme,
    colorscheme as colorschemeStore,
} from "./colorschemes";
import CommandPalette from "./CommandPalette";
import {
    type CommandResult,
    DEFAULT_MESSAGE,
    type Overlay,
    type Panel,
    type ToastSpec,
    cycleTab,
    isUnknownCommand,
    runCommand,
} from "./commands";
import { type EggId, foundEggs, resetEggs, unlockEgg } from "./eggs";
import { KONAMI_EVENT } from "./events";
import { Goodbye, Train } from "./Overlays";
import { EggsPanel, ExplorePanel, HelpPanel, NeofetchPanel } from "./Panels";
import {
    setVimKeysEnabled,
    useScrollPosition,
    useVimKeysEnabled,
} from "./prefs";
import {
    canHighlight,
    clearMatches,
    findMatches,
    paintMatches,
    revealMatch,
} from "./search";
import StatusPill, { type Mode } from "./StatusPill";
import Toaster from "./Toaster";
import { pushToast } from "./toast";

const SCROLL_STEP_PX = 80;
/** How long a chord's first key (g, d, y, Z) waits for the second. */
const CHORD_TIMEOUT_MS = 800;
const KONAMI =
    "arrowup,arrowup,arrowdown,arrowdown,arrowleft,arrowright,arrowleft,arrowright,b,a";
const TYPED_WORDS: Record<string, { egg: EggId; toast: ToastSpec }> = {
    emacs: {
        egg: "emacs",
        toast: { tone: "error", text: "Wrong editor, friend." },
    },
    andrew: { egg: "name", toast: { text: "That's me. Hi!" } },
};
const MAX_COOL = 7;

declare global {
    interface Window {
        andrew?: () => string;
    }
}

function isEditable(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return (
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
    );
}

function toast(spec: ToastSpec) {
    pushToast({ ...spec, tone: spec.tone ?? "info" });
}

interface SearchState {
    pattern: string;
    index: number;
    total: number;
    pathname: string | null;
}

/**
 * The site's Vim: modes, keys, the command palette, panels, `/` search, the
 * status pill and every key-driven Easter egg. Rendered once, in the layout.
 */
export default function VimShell() {
    const router = useRouter();
    const pathname = usePathname();
    const keysEnabled = useVimKeysEnabled();
    const ruler = useScrollPosition();
    const reducedMotion = useReducedMotion();
    const scheme = colorschemeStore.useValue();
    const eggs = foundEggs.useValue();

    const [palette, setPalette] = useState<":" | "/" | null>(null);
    const [panel, setPanel] = useState<Panel | null>(null);
    const [overlay, setOverlay] = useState<Overlay | null>(null);
    const [transientMode, setTransientMode] = useState<
        "INSERT" | "VISUAL" | null
    >(null);
    const [cool, setCool] = useState(0);
    const [search, setSearch] = useState<SearchState | null>(null);

    const ranges = useRef<Range[]>([]);
    const pending = useRef<{ key: string; at: number } | null>(null);
    const sequence = useRef<string[]>([]);
    const escapes = useRef<number[]>([]);
    const hoveredCard = useRef<HTMLElement | null>(null);
    const undoStack = useRef<HTMLElement[]>([]);
    const modeTimer = useRef<number | null>(null);

    // A search belongs to the page it was made on.
    const activeSearch = search && search.pathname === pathname ? search : null;
    const mode: Mode =
        palette === ":"
            ? "COMMAND"
            : palette === "/"
              ? "SEARCH"
              : (transientMode ?? "NORMAL");
    const message = activeSearch
        ? `/${activeSearch.pattern}   [${activeSearch.index + 1}/${activeSearch.total}]`
        : cool === 0
          ? DEFAULT_MESSAGE
          : cool > MAX_COOL
            ? "Okay. Maximum cool reached."
            : `This site owner is ${"extremely ".repeat(cool + 1)}cool.`;
    const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";

    const flashMode = useCallback((next: "INSERT" | "VISUAL", ms: number) => {
        if (modeTimer.current !== null) window.clearTimeout(modeTimer.current);
        setTransientMode(next);
        modeTimer.current = window.setTimeout(() => {
            setTransientMode(null);
            modeTimer.current = null;
        }, ms);
    }, []);

    const runSearch = useCallback(
        (pattern: string) => {
            if (!pattern) {
                clearMatches();
                ranges.current = [];
                setSearch(null);
                return;
            }
            const found = findMatches(
                document.querySelector("main") ?? document.body,
                pattern,
            );
            ranges.current = found;
            unlockEgg("search");
            if (!found.length) {
                clearMatches();
                setSearch(null);
                toast({
                    tone: "error",
                    text: `E486: Pattern not found: ${pattern}`,
                });
                return;
            }
            paintMatches(found, 0);
            revealMatch(found[0], behavior);
            setSearch({ pattern, index: 0, total: found.length, pathname });
            if (!canHighlight()) {
                toast({
                    text: "Found it, but this browser can't highlight matches.",
                });
            }
        },
        [behavior, pathname],
    );

    const stepSearch = useCallback(
        (direction: 1 | -1) => {
            const found = ranges.current;
            if (!activeSearch || !found.length) return;
            let next = activeSearch.index + direction;
            if (next >= found.length) {
                next = 0;
                toast({ text: "search hit BOTTOM, continuing at TOP" });
            } else if (next < 0) {
                next = found.length - 1;
                toast({ text: "search hit TOP, continuing at BOTTOM" });
            }
            paintMatches(found, next);
            revealMatch(found[next], behavior);
            setSearch({ ...activeSearch, index: next });
        },
        [activeSearch, behavior],
    );

    const apply = useCallback(
        (result: CommandResult | null) => {
            if (!result) return;
            switch (result.kind) {
                case "navigate":
                    router.push(result.href);
                    break;
                case "open":
                    window.open(result.href, "_blank", "noopener,noreferrer");
                    break;
                case "toast":
                    toast(result.toast);
                    break;
                case "keys":
                    setVimKeysEnabled(result.enabled);
                    toast({
                        text: result.enabled
                            ? "Vim keys on."
                            : "Vim keys off. The keyboard button in the status bar turns them back on.",
                    });
                    break;
                case "panel":
                    setPanel(result.panel);
                    break;
                case "overlay":
                    if (result.overlay === "train" && reducedMotion) {
                        toast({
                            text: "The train stayed in the station (reduced motion is on).",
                        });
                    } else {
                        setOverlay(result.overlay);
                    }
                    break;
                case "colorscheme":
                    applyColorscheme(result.name);
                    toast({
                        title: ":colorscheme",
                        text:
                            result.name === "default"
                                ? "Back to slate."
                                : `${COLORSCHEMES[result.name].label}. :colo default to go back.`,
                    });
                    break;
                case "search":
                    runSearch(result.pattern);
                    break;
                case "eggs-reset":
                    resetEggs();
                    toast({ text: "Easter eggs reset. Happy hunting." });
                    break;
            }
            if ("toast" in result && result.toast && result.kind !== "toast") {
                toast(result.toast);
            }
            if ("egg" in result && result.egg) unlockEgg(result.egg);
        },
        [reducedMotion, router, runSearch],
    );

    const run = useCallback(
        (line: string, fallback?: string) => {
            const context = { pathname, colorscheme: scheme };
            let result = runCommand(line, context);
            if (isUnknownCommand(result) && fallback)
                result = runCommand(fallback, context);
            apply(result);
        },
        [apply, pathname, scheme],
    );

    const closePalette = useCallback(() => {
        // Escaping out of `/` puts the previous search's highlights back.
        if (palette === "/") {
            if (activeSearch) paintMatches(ranges.current, activeSearch.index);
            else clearMatches();
        }
        setPalette(null);
    }, [activeSearch, palette]);

    const onPaletteRun = useCallback(
        (line: string, fallback?: string) => {
            const kind = palette;
            setPalette(null);
            if (kind === "/") runSearch(line);
            else run(line, fallback);
        },
        [palette, run, runSearch],
    );

    const deleteCard = useCallback(() => {
        const card = hoveredCard.current;
        if (!card || !card.isConnected || card.hidden) {
            toast({
                tone: "error",
                text: "Nothing under the cursor. Hover a card, then dd.",
            });
            return;
        }
        card.setAttribute("data-deleted", "");
        window.setTimeout(
            () => {
                if (card.hasAttribute("data-deleted")) card.hidden = true;
            },
            reducedMotion ? 0 : 280,
        );
        undoStack.current.push(card);
        toast({ text: "1 buffer deleted. Press u to undo." });
        unlockEgg("delete");
    }, [reducedMotion]);

    const undo = useCallback(() => {
        const card = undoStack.current.pop();
        if (!card || !card.isConnected) {
            toast({ text: "Already at oldest change" });
            return;
        }
        card.hidden = false;
        requestAnimationFrame(() =>
            requestAnimationFrame(() => card.removeAttribute("data-deleted")),
        );
        toast({ text: "1 buffer restored." });
    }, []);

    const yankUrl = useCallback(() => {
        const url = window.location.href;
        navigator.clipboard?.writeText(url).then(
            () => toast({ text: `Yanked ${url}` }),
            () => toast({ tone: "error", text: 'E353: Nothing in register "' }),
        );
        unlockEgg("yank");
    }, []);

    const toggleKeys = useCallback(() => {
        const next = !keysEnabled;
        setVimKeysEnabled(next);
        toast({
            text: next ? "Vim keys on. Press ? for help." : "Vim keys off.",
        });
    }, [keysEnabled]);

    const closeOverlay = useCallback(() => setOverlay(null), []);

    const onCool = useCallback(() => {
        const next = cool > MAX_COOL ? 0 : cool + 1;
        setCool(next);
        if (next === 2) unlockEgg("cool");
    }, [cool]);

    // Searches, deleted cards and undo history don't survive a page change.
    useEffect(() => {
        clearMatches();
        ranges.current = [];
        undoStack.current = [];
    }, [pathname]);

    // Remember which card the pointer (or focus) is on, for `dd`.
    useEffect(() => {
        const track = (event: Event) => {
            const target =
                event.target instanceof Element ? event.target : null;
            hoveredCard.current =
                target?.closest<HTMLElement>("[data-card]") ?? null;
        };
        document.addEventListener("pointerover", track);
        document.addEventListener("focusin", track);
        return () => {
            document.removeEventListener("pointerover", track);
            document.removeEventListener("focusin", track);
        };
    }, []);

    // Copying anything is a yank.
    useEffect(() => {
        const onCopy = () => {
            const text = window.getSelection()?.toString() ?? "";
            if (!text.trim()) return;
            const lines = text.trim().split("\n").length;
            toast({
                text:
                    lines > 1
                        ? `${lines} lines yanked`
                        : `${text.length} characters yanked`,
            });
            unlockEgg("yank");
        };
        document.addEventListener("copy", onCopy);
        return () => document.removeEventListener("copy", onCopy);
    }, []);

    // The console egg and the night owl.
    useEffect(() => {
        console.log(
            "%cHey, I'm Andrew.%c\nThis site speaks Vim: press : on the page. Or run andrew() right here.",
            "font: 600 16px system-ui",
            "font: 12px ui-monospace, monospace; color: #9ea4ab",
        );
        window.andrew = () => {
            unlockEgg("console");
            return "You found the console egg. Type :eggs on the page to see the rest.";
        };
        try {
            if (
                new Date().getHours() < 5 &&
                !window.sessionStorage.getItem("vim-nightowl")
            ) {
                window.sessionStorage.setItem("vim-nightowl", "1");
                toast({
                    title: "It's late.",
                    text: "Go to sleep. Right after you look at my projects.",
                });
                unlockEgg("nightowl");
            }
        } catch {
            // Session storage blocked; skip the greeting.
        }
        return () => {
            delete window.andrew;
        };
    }, []);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            // ⌘K / Ctrl+K: the modern way in, even with single keys off.
            if (
                (event.metaKey || event.ctrlKey) &&
                !event.altKey &&
                event.key.toLowerCase() === "k" &&
                !isEditable(event.target)
            ) {
                event.preventDefault();
                setPanel(null);
                setPalette(":");
                return;
            }
            if (
                !keysEnabled ||
                event.defaultPrevented ||
                event.isComposing ||
                event.metaKey ||
                event.ctrlKey ||
                event.altKey ||
                isEditable(event.target) ||
                palette ||
                overlay === "goodbye"
            ) {
                return;
            }

            // Sequences: the Konami code and typed words.
            sequence.current = [
                ...sequence.current,
                event.key.toLowerCase(),
            ].slice(-10);
            if (sequence.current.join(",") === KONAMI) {
                sequence.current = [];
                window.dispatchEvent(new Event(KONAMI_EVENT));
                toast({
                    title: "↑ ↑ ↓ ↓ ← → ← → B A",
                    text: "Cheat code accepted.",
                });
                unlockEgg("konami");
            }
            const typed = sequence.current
                .filter((key) => key.length === 1)
                .join("");
            for (const [word, { egg, toast: spec }] of Object.entries(
                TYPED_WORDS,
            )) {
                if (typed.endsWith(word)) {
                    sequence.current = [];
                    toast(spec);
                    unlockEgg(egg);
                }
            }

            const now = performance.now();
            const previous =
                pending.current && now - pending.current.at < CHORD_TIMEOUT_MS
                    ? pending.current.key
                    : null;
            pending.current = null;

            if (event.key === "Escape") {
                if (panel || transientMode) {
                    setPanel(null);
                    setTransientMode(null);
                    escapes.current = [];
                    return;
                }
                escapes.current = [
                    ...escapes.current.filter((at) => now - at < 1500),
                    now,
                ];
                if (escapes.current.length >= 3) {
                    escapes.current = [];
                    toast({ text: "*beep*" });
                    unlockEgg("beep");
                }
                return;
            }

            switch (previous && previous + event.key) {
                case "gg":
                    window.scrollTo({ top: 0, behavior });
                    event.preventDefault();
                    return;
                case "gt":
                case "gT":
                    router.push(
                        cycleTab(pathname, event.key === "t" ? 1 : -1).href,
                    );
                    event.preventDefault();
                    return;
                case "dd":
                    deleteCard();
                    event.preventDefault();
                    return;
                case "yy":
                    yankUrl();
                    event.preventDefault();
                    return;
                case "ZZ":
                    run("wq");
                    event.preventDefault();
                    return;
            }

            switch (event.key) {
                case "g":
                case "d":
                case "y":
                case "Z":
                    pending.current = { key: event.key, at: now };
                    return;
                case "j":
                    window.scrollBy({ top: SCROLL_STEP_PX, behavior });
                    break;
                case "k":
                    window.scrollBy({ top: -SCROLL_STEP_PX, behavior });
                    break;
                case "G":
                    window.scrollTo({
                        top: document.documentElement.scrollHeight,
                        behavior,
                    });
                    break;
                case ":":
                    setPanel(null);
                    setPalette(":");
                    break;
                case "/":
                    setPanel(null);
                    setPalette("/");
                    break;
                case "n":
                case "N":
                    if (!activeSearch) return;
                    stepSearch(event.key === "n" ? 1 : -1);
                    break;
                case "u":
                    undo();
                    break;
                case "i":
                case "I":
                case "o":
                case "O":
                    flashMode("INSERT", 1600);
                    toast({
                        tone: "error",
                        text: "E21: Cannot make changes, 'modifiable' is off",
                    });
                    unlockEgg("insert");
                    break;
                case "v":
                case "V":
                    flashMode("VISUAL", 4000);
                    toast({
                        text: "-- VISUAL -- It's a website: just drag to select.",
                    });
                    unlockEgg("visual");
                    break;
                case "?":
                    setPanel((current) => (current === "help" ? null : "help"));
                    break;
                default:
                    return;
            }
            event.preventDefault();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [
        activeSearch,
        behavior,
        deleteCard,
        flashMode,
        keysEnabled,
        overlay,
        palette,
        panel,
        pathname,
        router,
        run,
        stepSearch,
        transientMode,
        undo,
        yankUrl,
    ]);

    return (
        <>
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <StatusPill
                    mode={mode}
                    message={message}
                    ruler={ruler}
                    keysEnabled={keysEnabled}
                    helpOpen={panel === "help"}
                    onMessageClick={onCool}
                    onToggleKeys={toggleKeys}
                    onOpenPalette={() => {
                        setPanel(null);
                        setPalette(":");
                    }}
                    onToggleHelp={() =>
                        setPanel((current) =>
                            current === "help" ? null : "help",
                        )
                    }
                />
            </div>
            {panel === "help" && (
                <HelpPanel
                    keysEnabled={keysEnabled}
                    onToggleKeys={toggleKeys}
                    onClose={() => setPanel(null)}
                />
            )}
            {panel === "eggs" && (
                <EggsPanel
                    found={eggs}
                    onReset={() => apply({ kind: "eggs-reset" })}
                    onClose={() => setPanel(null)}
                />
            )}
            {panel === "explore" && (
                <ExplorePanel
                    onPick={(action) => {
                        setPanel(null);
                        if (action === "secrets") run("e secrets.txt");
                        else run(action);
                    }}
                    onClose={() => setPanel(null)}
                />
            )}
            {panel === "neofetch" && (
                <NeofetchPanel
                    colorscheme={scheme}
                    onClose={() => setPanel(null)}
                />
            )}
            {palette && (
                <CommandPalette
                    mode={palette}
                    eggsFound={eggs.length}
                    colorscheme={scheme}
                    onRun={onPaletteRun}
                    onSearchPreview={(pattern) =>
                        paintMatches(
                            pattern
                                ? findMatches(
                                      document.querySelector("main") ??
                                          document.body,
                                      pattern,
                                  )
                                : [],
                            0,
                        )
                    }
                    onClose={closePalette}
                />
            )}
            {overlay === "train" && <Train onDone={closeOverlay} />}
            {overlay === "goodbye" && <Goodbye onDone={closeOverlay} />}
            <Toaster />
        </>
    );
}
