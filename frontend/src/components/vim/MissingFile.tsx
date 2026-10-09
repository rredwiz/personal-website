"use client";
import { useEffect, useSyncExternalStore } from "react";
import { unlockEgg } from "./eggs";

const subscribeNothing = () => () => {};

/**
 * Vim's own complaint about the URL that 404'd. The 404 page is prerendered
 * once (as /_not-found), so the real path is only known in the browser: it is
 * filled in after hydration rather than rendered on the server, which would
 * make the hydrated text differ.
 */
export default function MissingFile() {
    const path = useSyncExternalStore(
        subscribeNothing,
        () => window.location.pathname,
        () => null,
    );
    // Finding a 404 is an Easter egg in its own right.
    useEffect(() => {
        unlockEgg("lost");
    }, []);
    return (
        <p className="font-mono text-sm text-accent">
            E484: Can&apos;t open file{path ? ` ~${path}` : ""}
        </p>
    );
}
