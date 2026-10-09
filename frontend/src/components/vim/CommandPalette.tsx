"use client";
import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import type { ColorschemeName } from "./colorschemes";
import { suggestCommands } from "./commands";

const ARG_COMMANDS = new Set(["colorscheme", "e"]);

/**
 * The `:` command line as a floating palette (like Neovim's noice.nvim), and
 * the `/` search prompt. `onRun` gets the typed line plus the suggestion to
 * fall back on if Vim wouldn't know the typed command.
 */
export default function CommandPalette({
    mode,
    eggsFound,
    colorscheme,
    onRun,
    onSearchPreview,
    onClose,
}: {
    mode: ":" | "/";
    eggsFound: number;
    colorscheme: ColorschemeName;
    onRun: (line: string, fallback?: string) => void;
    onSearchPreview: (pattern: string) => void;
    onClose: () => void;
}) {
    const [value, setValue] = useState("");
    const [selected, setSelected] = useState(0);
    const [explicit, setExplicit] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const listId = useId();

    const suggestions =
        mode === ":"
            ? suggestCommands(value, { eggsFound, colorscheme }).slice(0, 7)
            : [];
    const active = suggestions[Math.min(selected, suggestions.length - 1)];

    // Put focus back where it was when the palette closes.
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        inputRef.current?.focus();
        return () => previous?.focus?.();
    }, []);

    const update = (next: string) => {
        setValue(next);
        setSelected(0);
        setExplicit(false);
        if (mode === "/") onSearchPreview(next);
    };

    const complete = () => {
        if (!active) return;
        const [command] = active.command.split(" ");
        update(
            ARG_COMMANDS.has(command) && !active.command.includes(" ")
                ? `${active.command} `
                : active.command,
        );
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        switch (event.key) {
            case "ArrowDown":
            case "ArrowUp": {
                if (!suggestions.length) return;
                event.preventDefault();
                const step = event.key === "ArrowDown" ? 1 : -1;
                setSelected(
                    (current) =>
                        (current + step + suggestions.length) %
                        suggestions.length,
                );
                setExplicit(true);
                break;
            }
            case "Tab":
                if (!suggestions.length) return;
                event.preventDefault();
                complete();
                break;
            case "Enter":
                event.preventDefault();
                if (mode === "/") {
                    onRun(value);
                } else if (explicit && active) {
                    onRun(active.command);
                } else {
                    onRun(value, active?.command);
                }
                break;
            case "Escape":
                event.preventDefault();
                onClose();
                break;
            case "Backspace":
                if (!value) {
                    event.preventDefault();
                    onClose();
                }
                break;
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-canvas/40 px-4 pt-[16vh] backdrop-blur-[2px]"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="w-[min(36rem,100%)] overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-float backdrop-blur-xl motion-safe:animate-pop-in">
                <div className="flex items-center gap-3 px-4 py-3.5">
                    <span
                        aria-hidden="true"
                        className="font-mono text-base font-semibold text-accent"
                    >
                        {mode}
                    </span>
                    <input
                        ref={inputRef}
                        value={value}
                        onChange={(event) => update(event.target.value)}
                        onKeyDown={onKeyDown}
                        role="combobox"
                        aria-expanded={suggestions.length > 0}
                        aria-controls={listId}
                        aria-activedescendant={
                            active ? `${listId}-${selected}` : undefined
                        }
                        aria-label={
                            mode === ":" ? "Vim command" : "Search this page"
                        }
                        placeholder={
                            mode === ":"
                                ? "Type a command, or try help"
                                : "Search this page"
                        }
                        autoComplete="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        className="min-w-0 flex-1 bg-transparent font-mono text-[15px] text-ink caret-accent outline-none placeholder:text-ink-faint/70"
                    />
                    <kbd className="hidden rounded-md border border-line px-1.5 font-mono text-[10px] text-ink-faint sm:block">
                        esc
                    </kbd>
                </div>
                {suggestions.length > 0 && (
                    <ul
                        id={listId}
                        role="listbox"
                        aria-label="Suggestions"
                        className="border-t border-line p-1.5"
                    >
                        {suggestions.map((suggestion, index) => (
                            <li
                                key={suggestion.command}
                                id={`${listId}-${index}`}
                                role="option"
                                aria-selected={index === selected}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => onRun(suggestion.command)}
                                onMouseMove={() => {
                                    if (index !== selected) {
                                        setSelected(index);
                                        setExplicit(true);
                                    }
                                }}
                                className={cx(
                                    "flex cursor-pointer items-baseline justify-between gap-4 rounded-lg px-3 py-2",
                                    index === selected && "bg-white/[0.06]",
                                )}
                            >
                                <span className="font-mono text-[13px] text-ink">
                                    :{suggestion.command}
                                </span>
                                <span className="truncate text-sm text-ink-muted">
                                    {suggestion.description}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
                <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-4 py-2 font-mono text-[11px] text-ink-faint">
                    {mode === ":" ? (
                        <>
                            <span>↑↓ select</span>
                            <span>tab complete</span>
                            <span>↵ run</span>
                        </>
                    ) : (
                        <>
                            <span>↵ search</span>
                            <span>n / N next / previous</span>
                            <span>:noh clears</span>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
}
