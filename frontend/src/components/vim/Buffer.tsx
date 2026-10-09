import { Fragment, type ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * Text laid out like a Vim buffer with `:set number wrap`: a line-number
 * gutter, long lines that wrap under a single number, and `~` filler for the
 * rows below the last line when the window is taller than its text. Pass
 * `null` for an empty line.
 */
export function Buffer({
    lines,
    className,
}: {
    lines: ReadonlyArray<ReactNode | null>;
    className?: string;
}) {
    return (
        <div className={cx("flex min-h-0 flex-1 flex-col", className)}>
            <div className="grid grid-cols-[2ch_minmax(0,1fr)] items-baseline gap-x-4">
                {lines.map((line, index) => (
                    <Fragment key={index}>
                        <span
                            aria-hidden="true"
                            className={cx(
                                "text-right text-sm tabular-nums select-none",
                                // The "cursor line" number is highlighted, like CursorLineNr.
                                index === 0
                                    ? "text-ink-muted"
                                    : "text-ink-faint/45",
                            )}
                        >
                            {index + 1}
                        </span>
                        <div className="min-w-0">
                            {line ?? <span className="block h-[1.5em]" />}
                        </div>
                    </Fragment>
                ))}
            </div>
            {/*
             * The filler is absolutely positioned so it adds no height of its
             * own: it only shows in space the card already has (e.g. when a
             * taller neighbour stretches the row), never makes a card taller.
             */}
            <div aria-hidden="true" className="relative min-h-0 flex-1">
                <div className="absolute inset-0 overflow-hidden text-sm leading-[1.6] text-ink-faint/35 select-none">
                    {Array.from({ length: 24 }, (_, index) => (
                        <div key={index}>~</div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/** A blinking block cursor (steady with reduced motion). */
export function Cursor({ className }: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={cx(
                "ml-[0.08em] inline-block h-[0.95em] w-[0.55em] translate-y-[0.14em] bg-ink motion-safe:animate-blink",
                className,
            )}
        />
    );
}
