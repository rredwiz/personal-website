import type { AnchorHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

/** Underlined link for running text; the underline brightens on hover. */
export const INLINE_LINK_CLASS =
    "text-ink underline decoration-ink-faint/60 decoration-1 underline-offset-[5px] transition-colors duration-200 hover:decoration-ink";

/** A link that opens in a new tab with the safe `rel`. Unstyled unless `inline`. */
export default function ExternalLink({
    inline = false,
    className,
    ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { inline?: boolean }) {
    return (
        <a
            target="_blank"
            rel="noopener noreferrer"
            className={cx(inline && INLINE_LINK_CLASS, className)}
            {...rest}
        />
    );
}
