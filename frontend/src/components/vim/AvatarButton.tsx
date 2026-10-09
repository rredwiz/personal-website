"use client";
import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { cx } from "@/lib/cx";
import { unlockEgg } from "./eggs";
import { KONAMI_EVENT } from "./events";

/** What the avatar says after the nth poke. */
const LINES: Readonly<Record<number, string>> = {
    3: "hi!",
    5: "that tickles",
    8: "okay, okay",
    12: "i'm telling the cat",
    20: "you have a lot of free time",
    30: "fine. you win.",
};

/** The pixel avatar, pokeable (an Easter egg). It bounces, talks back, and spins for the Konami code. */
export default function AvatarButton() {
    const [pokes, setPokes] = useState(0);
    const [line, setLine] = useState<string | null>(null);
    const [spinning, setSpinning] = useState(false);
    const lineTimer = useRef<number | null>(null);

    useEffect(() => {
        let spinTimer: number | undefined;
        const onKonami = () => {
            setSpinning(true);
            spinTimer = window.setTimeout(() => setSpinning(false), 1200);
        };
        window.addEventListener(KONAMI_EVENT, onKonami);
        return () => {
            window.removeEventListener(KONAMI_EVENT, onKonami);
            window.clearTimeout(spinTimer);
            if (lineTimer.current !== null)
                window.clearTimeout(lineTimer.current);
        };
    }, []);

    const poke = () => {
        const next = pokes + 1;
        setPokes(next);
        if (LINES[next]) {
            setLine(LINES[next]);
            if (lineTimer.current !== null)
                window.clearTimeout(lineTimer.current);
            lineTimer.current = window.setTimeout(() => setLine(null), 2000);
        }
        if (next === 5) unlockEgg("avatar");
    };

    return (
        <button
            type="button"
            onClick={poke}
            aria-label="Poke Andrew's avatar"
            className="relative -mt-1 -ml-1 shrink-0 rounded-xl"
        >
            <span
                // Re-keying restarts the bounce on every poke.
                key={pokes}
                className={cx(
                    "block transition-transform duration-1000 ease-out",
                    pokes > 0 && "motion-safe:animate-boing",
                    spinning && "rotate-[360deg]",
                )}
            >
                <Avatar scale={5} preload />
            </span>
            {line && (
                <span
                    role="status"
                    className="absolute -top-2 left-[85%] z-10 rounded-full rounded-bl-sm border border-line bg-surface px-2.5 py-1 font-mono text-[11px] whitespace-nowrap text-ink-soft shadow-float backdrop-blur-xl motion-safe:animate-pop-in"
                >
                    {line}
                </span>
            )}
        </button>
    );
}
