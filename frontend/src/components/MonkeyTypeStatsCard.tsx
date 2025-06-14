"use client";
import { useEffect, useState } from "react";
import { TypingScore } from "@/types";
import { motion, animate } from "motion/react";
import MonkeyTypeLogo from "./MonkeyTypeLogo";

export default function MonkeyTypeStatsCard({
    averagewpm,
    bestwpm,
}: TypingScore) {
    const [displayPercentage, setDisplayPercentage] = useState(0);
    const [sliderWidth, setSliderWidth] = useState(0);

    useEffect(() => {
        const finalPercentage = Math.min((averagewpm / 150) * 100, 100);
        const controls = animate(0, finalPercentage, {
            duration: 1,
            ease: "easeOut",
            onUpdate: (latest) => {
                setDisplayPercentage(latest);
                setSliderWidth(latest);
            }
        });
        return () => controls.stop();
    }, [averagewpm]);

    return (
        <div className="flex flex-col gap-2 justify-center items-center p-4 col-span-1 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
            <div className="gap-3 flex justify-center items-center">
                <MonkeyTypeLogo width={50} height={50} />
                <div className="w-[1px] h-15 bg-gray-500"></div>
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold">
                        {/* {averagewpm.toFixed(1)} */}
                        <span className="text-md font-medium"> wpm</span>
                        <span className="text-sm"> avg</span>
                    </h3>
                    <h4 className="text-gray-400 font-semibold">
                        {/* {bestwpm.toFixed(1)} */}
                        <span className="text-sm font-medium"> wpm</span>
                        <span className="text-xs"> best</span>
                    </h4>
                </div>
            </div>
            <div className="relative w-[90%]">
                <div className="relative h-5 bg-gray-700/50 border-1 border-gray-500 rounded-3xl overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{
                            width: `${sliderWidth}%`,
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute h-full bg-gray-400 rounded-3xl"
                    />
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white"
                    >
                        {displayPercentage.toFixed(1)}%
                    </motion.div>
                </div>
                <div className="absolute -bottom-[15px] right-0 text-xs text-gray-400">
                    150 wpm avg goal
                </div>
            </div>
        </div>
    );
}
