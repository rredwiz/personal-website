"use client";
import { usePathname } from "next/navigation";

/** Vim's own complaint about the URL that 404'd. */
export default function MissingFile() {
    const pathname = usePathname();
    return (
        <p className="font-mono text-sm text-accent">
            E484: Can&apos;t open file ~{pathname ?? "/"}
        </p>
    );
}
