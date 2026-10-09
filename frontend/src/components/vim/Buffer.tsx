import { Fragment, type ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * Text laid out like a Vim buffer with `:set number wrap`: a line-number
 * gutter, and long lines that wrap under a single number. Pass `null` for an
 * empty line.
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
                                "text-right font-mono text-xs tabular-nums select-none",
                                // The "cursor line" number is highlighted, like CursorLineNr.
                                index === 0
                                    ? "text-ink-muted"
                                    : "text-ink-faint/40",
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
        </div>
    );
}

/** A blinking block cursor (steady with reduced motion). */
export function Cursor({ className }: { className?: string }) {
    return (
        <span
            aria-hidden="true"
            className={cx(
                "ml-[0.1em] inline-block h-[0.9em] w-[0.45em] translate-y-[0.12em] rounded-[2px] bg-ink motion-safe:animate-blink",
                className,
            )}
        />
    );
}
