"use client";
import { KeyboardIcon } from "@/components/icons";
import { cx } from "@/lib/cx";

export type Mode = "NORMAL" | "INSERT" | "VISUAL" | "COMMAND" | "SEARCH";

const MODE_CLASS: Record<Mode, string> = {
    NORMAL: "bg-ink text-canvas",
    INSERT: "bg-accent text-canvas",
    VISUAL: "bg-transparent text-accent ring-1 ring-accent ring-inset",
    COMMAND: "bg-accent text-canvas",
    SEARCH: "bg-accent text-canvas",
};

// No display utility here: each button sets its own (the keys toggle hides on phones).
const ICON_BUTTON_CLASS =
    "size-7 items-center justify-center rounded-full font-mono text-xs text-ink-faint transition-colors hover:bg-white/[0.07] hover:text-ink";

/** Vim's statusline, reimagined as a floating pill at the bottom of the page. */
export default function StatusPill({
    mode,
    message,
    ruler,
    keysEnabled,
    helpOpen,
    onMessageClick,
    onToggleKeys,
    onOpenPalette,
    onToggleHelp,
}: {
    mode: Mode;
    message: string;
    ruler: string;
    keysEnabled: boolean;
    helpOpen: boolean;
    onMessageClick: () => void;
    onToggleKeys: () => void;
    onOpenPalette: () => void;
    onToggleHelp: () => void;
}) {
    return (
        <div className="pointer-events-auto flex max-w-full items-center gap-1.5 rounded-full border border-line bg-surface p-1 font-mono text-xs shadow-float backdrop-blur-xl">
            <span
                className={cx(
                    "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] transition-colors",
                    MODE_CLASS[mode],
                )}
            >
                {mode}
            </span>
            <button
                type="button"
                onClick={onMessageClick}
                className="min-w-0 truncate rounded-full px-2 py-1 text-left font-sans text-[13px] text-ink-muted transition-colors hover:text-ink-soft"
            >
                {message}
            </button>
            {ruler !== "All" && (
                <span className="hidden shrink-0 px-1 text-ink-faint tabular-nums sm:inline">
                    {ruler}
                </span>
            )}
            <span aria-hidden="true" className="h-4 w-px shrink-0 bg-line" />
            {/* Phones get the keys toggle from the ? panel instead, to leave room for the message. */}
            <button
                type="button"
                onClick={onToggleKeys}
                aria-pressed={keysEnabled}
                aria-label="Vim keys"
                title={`Single-key Vim shortcuts: ${keysEnabled ? "on" : "off"}`}
                className={cx(
                    ICON_BUTTON_CLASS,
                    "hidden shrink-0 sm:flex",
                    !keysEnabled && "text-ink-faint/50 line-through",
                )}
            >
                <KeyboardIcon className="size-4" />
            </button>
            <button
                type="button"
                onClick={onOpenPalette}
                aria-label="Open the command palette"
                title="Command palette (: or ⌘K)"
                className={cx(ICON_BUTTON_CLASS, "flex shrink-0")}
            >
                :
            </button>
            <button
                type="button"
                onClick={onToggleHelp}
                aria-label="Keyboard help"
                aria-expanded={helpOpen}
                title="Help (?)"
                className={cx(ICON_BUTTON_CLASS, "flex shrink-0")}
            >
                ?
            </button>
        </div>
    );
}
