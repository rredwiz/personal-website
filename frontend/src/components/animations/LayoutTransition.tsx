"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef } from "react";
import FrozenRoute from "./FrozenRoute";

const PAGE_TRANSITION = { duration: 0.28, ease: "easeInOut" } as const;
const PAGE_OFFSET_PX = 12;
const SCROLL_UNLOCK_DELAY_MS = 100;

/**
 * Cross-fades pages on route changes (a plain swap with reduced motion).
 * Vertical scrolling is locked while a page is animating in or out so the
 * scrollbar doesn't flash; only `overflow-y` is touched so the body's
 * horizontal overflow class stays intact.
 */
export default function LayoutTransition({
    children,
}: {
    children: ReactNode;
}) {
    const pathname = usePathname();
    const reducedMotion = useReducedMotion();
    const unlockTimer = useRef<number | null>(null);
    const offset = reducedMotion ? 0 : PAGE_OFFSET_PX;

    const clearUnlockTimer = () => {
        if (unlockTimer.current !== null) {
            window.clearTimeout(unlockTimer.current);
            unlockTimer.current = null;
        }
    };

    const lockScroll = () => {
        clearUnlockTimer();
        document.body.style.overflowY = "hidden";
    };

    const unlockScroll = () => {
        clearUnlockTimer();
        unlockTimer.current = window.setTimeout(() => {
            document.body.style.overflowY = "";
            unlockTimer.current = null;
        }, SCROLL_UNLOCK_DELAY_MS);
    };

    // Never leave the page unscrollable if we unmount mid-transition.
    useEffect(() => {
        const timer = unlockTimer;
        return () => {
            if (timer.current !== null) window.clearTimeout(timer.current);
            document.body.style.overflowY = "";
        };
    }, []);

    return (
        <AnimatePresence
            mode="wait"
            initial={false}
            onExitComplete={unlockScroll}
        >
            <motion.div
                key={pathname}
                className="flex flex-1 flex-col"
                initial={{ opacity: 0, y: -offset }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: offset }}
                transition={reducedMotion ? { duration: 0 } : PAGE_TRANSITION}
                onAnimationStart={lockScroll}
                onAnimationComplete={unlockScroll}
            >
                <FrozenRoute>{children}</FrozenRoute>
            </motion.div>
        </AnimatePresence>
    );
}
