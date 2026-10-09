"use client";
import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import type { TypingScore } from "@/types";
import { cx } from "@/lib/cx";
import { Card } from "@/components/ui/Card";
import ExternalLink from "@/components/ui/ExternalLink";
import MonkeyTypeLogo from "./MonkeyTypeLogo";

/** The progress bar measures the best score against this goal. */
export const WPM_GOAL = 200;

export function goalPercentage(wpm: number): number {
    if (!Number.isFinite(wpm) || wpm <= 0) return 0;
    return Math.min((wpm / WPM_GOAL) * 100, 100);
}

export default function MonkeyTypeStatsCard({
    stats,
    className,
}: {
    stats: TypingScore | null;
    className?: string;
}) {
    const reducedMotion = useReducedMotion();
    const target = goalPercentage(stats?.bestwpm ?? 0);
    // Always 0 on the first render: the server can't know the visitor's
    // motion preference, so rendering anything else here would make the
    // hydrated markup differ from the server's. The count-up runs after
    // mount, in a single step for reduced motion.
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const controls = animate(0, target, {
            duration: reducedMotion ? 0 : 1,
            ease: "easeOut",
            onUpdate: setProgress,
        });
        return () => controls.stop();
    }, [target, reducedMotion]);

    return (
        <Card className={cx("flex flex-col", className)}>
            <div className="flex items-center justify-between gap-2">
                <ExternalLink
                    href="https://monkeytype.com/profile/redwiz"
                    aria-label="Monkeytype profile (opens in a new tab)"
                    className="group flex items-center gap-2 font-mono text-xs text-ink-faint transition-colors duration-200 hover:text-ink"
                >
                    <MonkeyTypeLogo className="size-5 transition-colors duration-200 group-hover:text-accent" />
                    monkeytype
                </ExternalLink>
                <span className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
                    15s
                </span>
            </div>
            <p className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-4xl font-semibold tracking-tight text-ink tabular-nums">
                    {stats ? stats.bestwpm : "—"}
                </span>
                <span className="text-sm text-ink-muted">wpm best</span>
            </p>
            <div className="mt-auto pt-5">
                <div
                    className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
                    role="progressbar"
                    aria-label={`Best score towards ${WPM_GOAL} wpm`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                >
                    <motion.div
                        initial={false}
                        animate={{ width: `${progress}%` }}
                        transition={
                            reducedMotion
                                ? { duration: 0 }
                                : { duration: 0.5, ease: "easeOut" }
                        }
                        className="h-full rounded-full bg-accent"
                    />
                </div>
                <p className="mt-2 flex justify-between gap-2 font-mono text-[11px] text-ink-faint">
                    <span>
                        {stats
                            ? `${Math.round(progress)}% of goal`
                            : "typing stats unavailable"}
                    </span>
                    <span>{WPM_GOAL} wpm</span>
                </p>
            </div>
        </Card>
    );
}
