"use client";
import { useEffect } from "react";

const TRAIN = String.raw`
         (@@)  (  )   (@)   ( )
      (@@@)
     ====
   _|    |_____   ____________________   ____________________
  |   ___      |  |   andster.dev    |  |  now with vim keys |
  |__|   |_____|__|__________________|__|____________________|
    (O)-(O)        (O)          (O)        (O)          (O)`;

/** `:!sl`: you meant `ls`, but here's a train. Decorative only. */
export function Train({ onDone }: { onDone: () => void }) {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 bottom-24 z-50 overflow-hidden"
        >
            <pre
                onAnimationEnd={onDone}
                className="w-max animate-chug font-mono text-[11px] leading-[1.25] text-ink-soft sm:text-xs"
            >
                {TRAIN}
            </pre>
        </div>
    );
}

/** `:q!`: Vim "exits", briefly. */
export function Goodbye({ onDone }: { onDone: () => void }) {
    useEffect(() => {
        const timer = window.setTimeout(onDone, 2600);
        return () => window.clearTimeout(timer);
    }, [onDone]);

    return (
        <div
            role="status"
            className="fixed inset-0 z-[60] grid place-items-center bg-canvas px-6 text-center"
        >
            <div className="motion-safe:animate-pop-in">
                <p className="font-mono text-sm text-ink-faint">
                    [Process exited 0]
                </p>
                <p className="mt-3 text-2xl font-semibold text-ink">
                    Just kidding. Nobody exits Vim.
                </p>
            </div>
        </div>
    );
}
