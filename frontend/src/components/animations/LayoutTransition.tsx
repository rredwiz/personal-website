"use client";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import React, { ReactNode } from "react";
import FrozenRoute from "./FrozenRoute";

export default function Template({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
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
