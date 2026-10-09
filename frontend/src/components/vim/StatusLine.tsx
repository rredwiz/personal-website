"use client";
import { useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import {
    type CommandResult,
    DEFAULT_MESSAGE,
    bufferName,
    cycleTab,
    runCommand,
} from "./commands";
import {
    setVimKeysEnabled,
    useScrollPosition,
    useVimKeysEnabled,
} from "./prefs";
import VimHelp from "./VimHelp";

const SCROLL_STEP_PX = 80;
/** How long a lone `g` waits for the second key of `gg` / `gt` / `gT`. */
const CHORD_TIMEOUT_MS = 800;

interface Message {
    text: string;
    error?: boolean;
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

const CHIP_CLASS =
    "rounded border border-line px-1.5 leading-5 text-ink-faint transition-colors hover:border-line-strong hover:text-ink";

/**
 * Vim's statusline and command line, docked at the bottom of the page. Owns the
 * site's Vim keys (j/k, gg/G, gt/gT, :, ?), which can be switched off with the
 * `keys:` toggle or `:set nokeys`.
 */
export default function StatusLine() {
    const router = useRouter();
    const pathname = usePathname();
    const keysEnabled = useVimKeysEnabled();
    const position = useScrollPosition();
    const reducedMotion = useReducedMotion();

    const [commandMode, setCommandMode] = useState(false);
    const [draft, setDraft] = useState("");
    const [message, setMessage] = useState<Message>({ text: DEFAULT_MESSAGE });
    const [helpOpen, setHelpOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const pendingG = useRef<number | null>(null);

    const openCommandLine = useCallback(() => {
        setDraft("");
        setCommandMode(true);
    }, []);

    const closeCommandLine = useCallback(() => {
        setCommandMode(false);
        setDraft("");
    }, []);

    const toggleKeys = useCallback(() => {
        const next = !keysEnabled;
        setVimKeysEnabled(next);
        setMessage({
            text: next
                ? "Vim keys on. Press ? for help."
                : "Vim keys off. Click keys:off to turn them back on.",
        });
    }, [keysEnabled]);

    const apply = useCallback(
        (result: CommandResult | null) => {
            if (!result) return;
            switch (result.kind) {
                case "navigate":
                    router.push(result.href);
                    setMessage({ text: result.message });
                    break;
                case "open":
                    window.open(result.href, "_blank", "noopener,noreferrer");
                    setMessage({ text: result.message });
                    break;
                case "message":
                    setMessage({ text: result.text, error: result.error });
                    break;
                case "keys":
                    setVimKeysEnabled(result.enabled);
                    setMessage({
                        text: result.enabled
                            ? "Vim keys on."
                            : "Vim keys off. Click keys:off to turn them back on.",
                    });
                    break;
                case "help":
                    setHelpOpen(true);
                    break;
            }
        },
        [router],
    );

    // Focus the command input as soon as it appears.
    useEffect(() => {
        if (commandMode) inputRef.current?.focus();
    }, [commandMode]);

    useEffect(() => {
        if (!keysEnabled) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (
                event.defaultPrevented ||
                event.isComposing ||
                event.metaKey ||
                event.ctrlKey ||
                event.altKey ||
                isEditable(event.target)
            ) {
                return;
            }
            const behavior: ScrollBehavior = reducedMotion ? "auto" : "smooth";
            const now = performance.now();
            const chord =
                pendingG.current !== null &&
                now - pendingG.current < CHORD_TIMEOUT_MS;
            pendingG.current = null;

            switch (event.key) {
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
                case "g":
                    if (!chord) {
                        pendingG.current = now;
                        return;
                    }
                    window.scrollTo({ top: 0, behavior });
                    break;
                case "t":
                case "T":
                    if (!chord) return;
                    router.push(
                        cycleTab(pathname, event.key === "t" ? 1 : -1).href,
                    );
                    break;
                case ":":
                    openCommandLine();
                    break;
                case "?":
                    setHelpOpen((open) => !open);
                    break;
                case "Escape":
                    setHelpOpen(false);
                    setMessage({ text: DEFAULT_MESSAGE });
                    return;
                default:
                    return;
            }
            event.preventDefault();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [keysEnabled, openCommandLine, pathname, reducedMotion, router]);

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        const result = runCommand(draft, pathname);
        closeCommandLine();
        apply(result);
    };

    return (
        <div className="relative font-mono text-xs">
            {helpOpen && (
                <VimHelp
                    keysEnabled={keysEnabled}
                    onToggleKeys={toggleKeys}
                    onClose={() => setHelpOpen(false)}
                />
            )}
            <div className="flex h-7 items-stretch border-t border-line bg-surface backdrop-blur-md">
                <span
                    className={cx(
                        "flex items-center px-2.5 font-semibold tracking-wider",
                        commandMode
                            ? "bg-accent text-canvas"
                            : "bg-ink text-canvas",
                    )}
                >
                    {commandMode ? "COMMAND" : "NORMAL"}
                </span>
                <span className="flex min-w-0 items-center px-3 text-ink-soft">
                    <span className="truncate">{bufferName(pathname)}</span>
                </span>
                <span className="ml-auto hidden items-center gap-3 px-3 text-ink-faint sm:flex">
                    <span>markdown</span>
                    <span>utf-8</span>
                </span>
                <button
                    type="button"
                    onClick={toggleKeys}
                    aria-pressed={keysEnabled}
                    title="Single-key Vim shortcuts (j, k, gg, G, gt, :, ?)"
                    className="ml-auto flex items-center border-l border-line px-3 text-ink-faint transition-colors hover:text-ink sm:ml-0"
                >
                    keys:{keysEnabled ? "on" : "off"}
                </button>
                <span className="flex w-14 items-center justify-center border-l border-line text-ink-soft tabular-nums">
                    {position}
                </span>
            </div>
            <div className="flex h-7 items-center gap-3 border-t border-line/60 bg-canvas/70 px-3 backdrop-blur-md">
                {commandMode ? (
                    <form
                        onSubmit={onSubmit}
                        className="flex min-w-0 flex-1 items-center"
                    >
                        <span aria-hidden="true" className="text-ink">
                            :
                        </span>
                        <input
                            ref={inputRef}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Escape" ||
                                    (event.key === "Backspace" && !draft)
                                ) {
                                    event.preventDefault();
                                    closeCommandLine();
                                }
                            }}
                            onBlur={closeCommandLine}
                            aria-label="Vim command (try help)"
                            autoComplete="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            className="min-w-0 flex-1 bg-transparent text-ink caret-accent outline-none"
                        />
                    </form>
                ) : (
                    <p
                        role="status"
                        className={cx(
                            "min-w-0 flex-1 truncate",
                            message.error
                                ? "font-semibold text-ink"
                                : "text-ink-muted",
                        )}
                    >
                        {message.text}
                    </p>
                )}
                <span className="flex shrink-0 items-center gap-1.5">
                    <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={openCommandLine}
                        aria-label="Open the command line"
                        className={CHIP_CLASS}
                    >
                        :
                    </button>
                    <button
                        type="button"
                        onClick={() => setHelpOpen((open) => !open)}
                        aria-label="Keyboard help"
                        aria-expanded={helpOpen}
                        className={CHIP_CLASS}
                    >
                        ?
                    </button>
                </span>
            </div>
        </div>
    );
}
