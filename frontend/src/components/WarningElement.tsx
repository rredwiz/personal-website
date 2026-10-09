import { InfoIcon } from "@/components/icons";
import { cx } from "@/lib/cx";

export default function WarningElement({ className }: { className?: string }) {
    return (
        <p
            className={cx(
                "group inline-flex cursor-default items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-ink-muted shadow-card backdrop-blur-md",
                className,
            )}
        >
            <InfoIcon className="size-3.5 text-accent transition-transform duration-300 group-hover:rotate-12" />
            This site owner is extremely cool.
        </p>
    );
}
