"use client";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import React, { ReactNode, useRef, useEffect } from "react";
import FrozenRoute from "./FrozenRoute";

export default function Template({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    useEffect(() => {
        return () => {
            document.body.style.overflow = "hidden";
        };
    });

    const handleAnimationStart = () => {
        document.body.style.overflow = "hidden";
    };

    const handleAnimationEnd = () => {
        setTimeout(() => {
            document.body.style.overflow = "auto";
        }, 10);
    };

    return (
        <AnimatePresence
            mode="wait"
            initial={false}
            onExitComplete={handleAnimationEnd}
        >
            <motion.div
                onAnimationStart={handleAnimationStart}
                onAnimationEnd={handleAnimationEnd}
                key={pathname}
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: -30 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                <FrozenRoute>{children}</FrozenRoute>
            </motion.div>
        </AnimatePresence>
    );
}
