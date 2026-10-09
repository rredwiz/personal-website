"use client";
import { useEffect, useRef } from "react";

/**
 * Run `task` immediately and then every `intervalMs`, but only while the tab is
 * visible (hidden tabs skip ticks and refresh as soon as they come back).
 *
 * Each run gets an `AbortSignal` that is aborted when a newer run starts or the
 * component unmounts, so a slow response can never overwrite a newer one.
 */
export function usePolling(task: (signal: AbortSignal) => Promise<void> | void, intervalMs: number): void {
    // Always call the latest `task` without re-subscribing the interval on every render.
    const taskRef = useRef(task);
    useEffect(() => {
        taskRef.current = task;
    }, [task]);

    useEffect(() => {
        let controller: AbortController | null = null;

        const run = () => {
            controller?.abort();
            controller = new AbortController();
            void taskRef.current(controller.signal);
        };
        const runIfVisible = () => {
            if (document.visibilityState !== "hidden") run();
        };

        run();
        const timer = window.setInterval(runIfVisible, intervalMs);
        document.addEventListener("visibilitychange", runIfVisible);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", runIfVisible);
            controller?.abort();
        };
    }, [intervalMs]);
}
