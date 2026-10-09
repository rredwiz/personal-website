import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

const CARD_CLASS =
    "relative rounded-2xl border border-line bg-surface p-5 shadow-card";

type CardProps = HTMLAttributes<HTMLElement> & {
    as?: "div" | "section" | "article";
};

/** The glass panel every block on the site sits in. */
export function Card({ as: Tag = "div", className, ...rest }: CardProps) {
    return <Tag className={cx(CARD_CLASS, className)} {...rest} />;
}

/**
 * A file-viewer style header bar ("andrew/README.md") flush with the top of a
 * Card. Pass the label's segments as children.
 */
export function CardFileBar({
    icon,
    children,
    className,
}: {
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cx(
                "-mx-5 -mt-5 mb-4 flex items-center gap-2 rounded-t-2xl border-b border-line bg-white/[0.02] px-5 py-2.5 font-mono text-xs text-ink-faint",
                className,
            )}
        >
            {icon}
            {children}
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
