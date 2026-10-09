"use client";
import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import type { TypingScore } from "@/types";
import MonkeyTypeLogo from "./MonkeyTypeLogo";

/** The progress bar measures the average against this goal. */
export const WPM_GOAL = 150;

export function goalPercentage(averagewpm: number): number {
    if (!Number.isFinite(averagewpm) || averagewpm <= 0) return 0;
    return Math.min((averagewpm / WPM_GOAL) * 100, 100);
}

export default function MonkeyTypeStatsCard({ stats }: { stats: TypingScore | null }) {
    const reducedMotion = useReducedMotion();
    const target = goalPercentage(stats?.averagewpm ?? 0);
    const [animated, setAnimated] = useState(0);
    // With reduced motion the bar just sits at its final value.
    const progress = reducedMotion ? target : animated;

    useEffect(() => {
        if (reducedMotion) return;
        const controls = animate(0, target, {
            duration: 1,
            ease: "easeOut",
            onUpdate: setAnimated,
        });
        return () => controls.stop();
    }, [target, reducedMotion]);

    return (
        <div className="flex flex-col gap-2 justify-center items-center p-4 col-span-1 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
            <div className="gap-3 flex justify-center items-center">
                <MonkeyTypeLogo width={50} height={50} />
                <div className="w-[1px] h-15 bg-gray-500"></div>
                <div className="flex flex-col">
                    <p className="text-lg font-semibold">
                        {stats ? stats.averagewpm : "—"}
                        <span className="font-medium"> wpm</span>
                        <span className="text-sm"> avg</span>
                    </p>
                    <p className="text-gray-400 font-semibold">
                        {stats ? stats.bestwpm : "—"}
                        <span className="text-sm font-medium"> wpm</span>
                        <span className="text-xs"> best</span>
                    </p>
                </div>
            </div>
            <div className="relative w-[90%]">
                <div
                    className="relative h-5 bg-gray-700/50 border-1 border-gray-500 rounded-3xl overflow-hidden"
                    role="progressbar"
                    aria-label={`Progress towards ${WPM_GOAL} wpm`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                >
                    <motion.div
                        initial={false}
                        animate={{ width: `${progress}%` }}
                        transition={reducedMotion ? { duration: 0 } : { duration: 0.5, ease: "easeOut" }}
                        className="absolute h-full bg-gray-400 rounded-3xl"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                        {stats ? `${progress.toFixed(1)}% to ${WPM_GOAL}wpm` : "typing stats unavailable"}
                    </div>
                </div>
            </div>
        </div>
    );
}
