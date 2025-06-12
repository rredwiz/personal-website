import React from "react";
import { TypingScore } from "@/types";

export default function MonkeyTypeStatsCard({
    averagewpm,
    bestwpm,
}: TypingScore) {
    return (
        <div className="p-4 col-span-1 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
            <h3 className="text-2xl">{averagewpm}</h3>
            <p className="text-gray-400">{bestwpm}</p>
        </div>
    );
}
