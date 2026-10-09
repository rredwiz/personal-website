"use client";
import Image from "next/image";
import { type ReactNode, useEffect, useRef, useSyncExternalStore } from "react";
import { cx } from "@/lib/cx";
import { COLORSCHEMES, type ColorschemeName } from "./colorschemes";
import { EGGS, type EggId } from "./eggs";

/** The shared floating window: rounded glass, docked above the status pill. */
function FloatingPanel({
    title,
    label,
    onClose,
    children,
    className,
}: {
    title: ReactNode;
    label: string;
    onClose: () => void;
    children: ReactNode;
    className?: string;
}) {
    const closeRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        closeRef.current?.focus({ preventScroll: true });
    }, []);
    return (
        <section
            aria-label={label}
            className={cx(
                "fixed bottom-20 left-1/2 z-40 max-h-[min(70vh,34rem)] w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 overflow-y-auto rounded-2xl border border-line-strong bg-surface p-5 shadow-float backdrop-blur-xl motion-safe:animate-pop-in",
                className,
            )}
        >
            <div className="mb-4 flex items-center justify-between gap-4">
                <p className="font-mono text-xs text-ink-faint">{title}</p>
                <button
                    ref={closeRef}
                    type="button"
                    onClick={onClose}
                    className="rounded-md font-mono text-xs text-ink-faint transition-colors hover:text-ink"
                >
                    :close
                </button>
            </div>
            {children}
        </section>
    );
}

function Rows({ rows }: { rows: ReadonlyArray<[string, string]> }) {
    return (
        <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-1.5 text-sm">
            {rows.map(([keys, what]) => (
                <div key={keys} className="contents">
                    <dt className="font-mono text-[13px] text-ink">{keys}</dt>
                    <dd className="text-ink-muted">{what}</dd>
                </div>
            ))}
        </dl>
    );
}

export function HelpPanel({
    keysEnabled,
    onToggleKeys,
    onClose,
}: {
    keysEnabled: boolean;
    onToggleKeys: () => void;
    onClose: () => void;
}) {
    return (
        <FloatingPanel title="help.txt" label="Keyboard help" onClose={onClose}>
            <p className="mb-2 font-mono text-[11px] tracking-wider text-ink-faint">
                NORMAL MODE
            </p>
            <Rows
                rows={[
                    ["j / k", "Scroll down / up"],
                    ["gg / G", "Top / bottom"],
                    ["gt / gT", "Next / previous tab"],
                    [": or ⌘K", "Command palette"],
                    ["/", "Search this page (n / N to jump)"],
                    ["?", "This help"],
                ]}
            />
            <p className="mt-5 mb-2 font-mono text-[11px] tracking-wider text-ink-faint">
                COMMANDS
            </p>
            <Rows
                rows={[
                    [":home  :projects", "Switch tabs"],
                    [":github  :linkedin", "Open a profile"],
                    [":resume", "Open the résumé"],
                    [":colorscheme", "Change the colors"],
                    [":q", "Go on, try it"],
                ]}
            />
            <p className="mt-5 text-sm text-ink-muted">
                There are a few things this list doesn&apos;t mention.
            </p>
            <button
                type="button"
                onClick={onToggleKeys}
                aria-pressed={keysEnabled}
                className="mt-4 w-full rounded-xl border border-line px-3 py-2 text-left text-sm text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
            >
                Single-key shortcuts are {keysEnabled ? "on" : "off"}. Click to
                turn them {keysEnabled ? "off" : "on"}.
            </button>
        </FloatingPanel>
    );
}

export function EggsPanel({
    found,
    onReset,
    onClose,
}: {
    found: readonly EggId[];
    onReset: () => void;
    onClose: () => void;
}) {
    const percent = Math.round((found.length / EGGS.length) * 100);
    return (
        <FloatingPanel title=":eggs" label="Easter eggs" onClose={onClose}>
            <p className="text-sm text-ink-soft">
                <span className="font-mono text-ink">{found.length}</span> of{" "}
                <span className="font-mono">{EGGS.length}</span> Easter eggs
                found.
                {found.length === EGGS.length && " All of them. Respect."}
            </p>
            <div
                role="progressbar"
                aria-label="Easter eggs found"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="mt-2 mb-4 h-1 overflow-hidden rounded-full bg-white/[0.08]"
            >
                <div
                    className="h-full rounded-full bg-accent transition-[width] duration-500"
                    style={{ width: `${percent}%` }}
                />
            </div>
            <ul className="grid gap-1.5 text-sm">
                {EGGS.map((egg) => {
                    const done = found.includes(egg.id);
                    return (
                        <li
                            key={egg.id}
                            className="flex items-baseline justify-between gap-4"
                        >
                            <span
                                className={done ? "text-ink" : "text-ink-faint"}
                            >
                                <span
                                    aria-hidden="true"
                                    className="mr-2 font-mono text-xs"
                                >
                                    {done ? "✓" : "·"}
                                </span>
                                {done ? egg.name : "???"}
                                {!done && (
                                    <span className="sr-only">
                                        (not found yet)
                                    </span>
                                )}
                            </span>
                            {!done && (
                                <span className="truncate font-mono text-xs text-ink-faint">
                                    {egg.hint}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ul>
            {found.length > 0 && (
                <button
                    type="button"
                    onClick={onReset}
                    className="mt-5 font-mono text-xs text-ink-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                    :eggs reset
                </button>
            )}
        </FloatingPanel>
    );
}

const NETRW_ENTRIES: ReadonlyArray<{
    name: string;
    action: "home" | "projects" | "resume" | "secrets";
}> = [
    { name: "home.md", action: "home" },
    { name: "projects.md", action: "projects" },
    { name: "resume.pdf", action: "resume" },
    { name: "secrets.txt", action: "secrets" },
];

/** `:Ex`: a netrw directory listing of the "files" this site is made of. */
export function ExplorePanel({
    onPick,
    onClose,
}: {
    onPick: (action: (typeof NETRW_ENTRIES)[number]["action"]) => void;
    onClose: () => void;
}) {
    return (
        <FloatingPanel title="netrw" label="File explorer" onClose={onClose}>
            <pre className="mb-3 font-mono text-[11px] leading-relaxed text-ink-faint">
                {`" ==================================
" Netrw Directory Listing
"   /home/andrew
"   Sorted by    name
" ==================================`}
            </pre>
            <ul className="font-mono text-sm">
                <li className="px-2 py-1 text-ink-faint">../</li>
                {NETRW_ENTRIES.map((entry) => (
                    <li key={entry.name}>
                        <button
                            type="button"
                            onClick={() => onPick(entry.action)}
                            className="w-full rounded-lg px-2 py-1 text-left text-ink-soft transition-colors hover:bg-white/[0.06] hover:text-ink"
                        >
                            {entry.name}
                        </button>
                    </li>
                ))}
            </ul>
        </FloatingPanel>
    );
}

const subscribeNothing = () => () => {};

/** `:!neofetch`: the obligatory setup flex. */
export function NeofetchPanel({
    colorscheme,
    onClose,
}: {
    colorscheme: ColorschemeName;
    onClose: () => void;
}) {
    // Page age as "uptime"; read once per render on the client only.
    const uptime = useSyncExternalStore(
        subscribeNothing,
        () => Math.max(1, Math.round(performance.now() / 60000)),
        () => 1,
    );
    const rows: ReadonlyArray<[string, string]> = [
        ["OS", "Next.js 16 / React 19"],
        ["Host", "Vercel + Render"],
        ["Shell", "zsh"],
        ["Editor", "vim (obviously)"],
        ["Font", "Figtree, JetBrains Mono"],
        ["Theme", COLORSCHEMES[colorscheme].label],
        ["Uptime", `${uptime} min (this tab)`],
    ];
    return (
        <FloatingPanel
            title=":!neofetch"
            label="neofetch"
            onClose={onClose}
            className="w-[min(32rem,calc(100vw-2rem))]"
        >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <Image
                    src="/pixierou.png"
                    width={96}
                    height={96}
                    alt=""
                    unoptimized
                    className="shrink-0 [image-rendering:pixelated]"
                />
                <div className="min-w-0 font-mono text-[13px]">
                    <p className="text-ink">
                        andrew<span className="text-ink-faint">@</span>
                        andster.dev
                    </p>
                    <p className="text-ink-faint">------------------</p>
                    {rows.map(([key, value]) => (
                        <p key={key} className="truncate">
                            <span className="text-accent">{key}</span>
                            <span className="text-ink-faint">: </span>
                            <span className="text-ink-soft">{value}</span>
                        </p>
                    ))}
                    <div className="mt-3 flex gap-1" aria-hidden="true">
                        {[
                            "bg-canvas",
                            "bg-ink-faint",
                            "bg-ink-muted",
                            "bg-ink-soft",
                            "bg-ink",
                            "bg-accent",
                        ].map((swatch) => (
                            <span
                                key={swatch}
                                className={cx(
                                    "size-5 rounded-md border border-line",
                                    swatch,
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </FloatingPanel>
    );
}
