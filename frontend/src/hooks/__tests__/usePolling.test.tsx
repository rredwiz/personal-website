import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePolling } from "@/hooks/usePolling";

function setVisibility(state: DocumentVisibilityState) {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
    document.dispatchEvent(new Event("visibilitychange"));
}

describe("usePolling", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        setVisibility("visible");
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("runs immediately, then on every interval, and stops on unmount", () => {
        const task = vi.fn();
        const { unmount } = renderHook(() => usePolling(task, 1000));
        expect(task).toHaveBeenCalledTimes(1);

        act(() => {
            vi.advanceTimersByTime(3000);
        });
        expect(task).toHaveBeenCalledTimes(4);

        unmount();
        act(() => {
            vi.advanceTimersByTime(3000);
        });
        expect(task).toHaveBeenCalledTimes(4);
    });

    it("skips ticks while hidden and runs as soon as the tab is visible again", () => {
        const task = vi.fn();
        renderHook(() => usePolling(task, 1000));

        act(() => {
            setVisibility("hidden");
            vi.advanceTimersByTime(5000);
        });
        expect(task).toHaveBeenCalledTimes(1);

        act(() => {
            setVisibility("visible");
        });
        expect(task).toHaveBeenCalledTimes(2);
    });

    it("aborts the previous run when a new one starts and on unmount", () => {
        const signals: AbortSignal[] = [];
        const task = vi.fn((signal: AbortSignal) => {
            signals.push(signal);
        });
        const { unmount } = renderHook(() => usePolling(task, 1000));

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(signals).toHaveLength(2);
        expect(signals[0].aborted).toBe(true);
        expect(signals[1].aborted).toBe(false);

        unmount();
        expect(signals[1].aborted).toBe(true);
    });

    it("always calls the latest task without resubscribing", () => {
        const first = vi.fn();
        const second = vi.fn();
        const { rerender } = renderHook(({ task }) => usePolling(task, 1000), { initialProps: { task: first } });
        expect(first).toHaveBeenCalledTimes(1);

        rerender({ task: second });
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(first).toHaveBeenCalledTimes(1);
        expect(second).toHaveBeenCalledTimes(1);
    });
});
