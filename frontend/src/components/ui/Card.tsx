import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

// `group/card` lets a card's file bar light up like Vim's active window.
const CARD_CLASS =
    "group/card relative rounded-xl border border-line bg-surface p-5 shadow-card";

type CardProps = HTMLAttributes<HTMLElement> & {
    as?: "div" | "section" | "article";
};

/** The glass panel every block on the site sits in. */
export function Card({ as: Tag = "div", className, ...rest }: CardProps) {
    return <Tag className={cx(CARD_CLASS, className)} {...rest} />;
}

/**
 * A window bar ("andrew/README.md ... markdown") flush with the top of a Card;
 * it brightens while the card is hovered, like Vim's active window. Pass the
 * label's segments as children and the filetype as `meta`.
 */
export function CardFileBar({
    icon,
    children,
    meta,
    className,
}: {
    icon?: ReactNode;
    children: ReactNode;
    meta?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cx(
                "-mx-5 -mt-5 mb-4 flex items-center gap-2 rounded-t-xl border-b border-line bg-white/[0.02] px-5 py-2 font-mono text-xs text-ink-faint transition-colors duration-200 group-hover/card:bg-white/[0.04] group-hover/card:text-ink-muted",
                className,
            )}
        >
            {icon}
            {children}
            {meta && <span className="ml-auto text-ink-faint/70">{meta}</span>}
        </div>
    );
}

/** Small monospace label at the top of a card ("monkeytype", "now playing", ...). */
export function CardLabel({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <p
            className={cx(
                "flex items-center gap-2 font-mono text-xs text-ink-faint",
                className,
            )}
        >
            {children}
        </p>
    );
}
