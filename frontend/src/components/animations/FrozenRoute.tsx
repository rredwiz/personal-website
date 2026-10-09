"use client";
// Freezes the router context a page was rendered with so that, during an exit
// animation, the outgoing page keeps rendering its *old* route instead of
// re-rendering as the new one. This is the standard workaround for using
// AnimatePresence exit animations with the Next.js App Router; it relies on an
// internal Next.js module, so check this still resolves after Next upgrades.
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReactNode, useContext, useState } from "react";

export default function FrozenRoute({ children }: { children: ReactNode }) {
    const context = useContext(LayoutRouterContext);
    // useState keeps the very first context value for the life of the component.
    const [frozen] = useState(context);

    return <LayoutRouterContext.Provider value={frozen}>{children}</LayoutRouterContext.Provider>;
}
