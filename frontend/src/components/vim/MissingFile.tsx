"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { unlockEgg } from "./eggs";

/** Vim's own complaint about the URL that 404'd. */
export default function MissingFile() {
    const pathname = usePathname();
    // Finding a 404 is an Easter egg in its own right.
    useEffect(() => {
        unlockEgg("lost");
    }, []);
    return (
        <p className="font-mono text-sm text-accent">
            E484: Can&apos;t open file ~{pathname ?? "/"}
        </p>
    );
}
