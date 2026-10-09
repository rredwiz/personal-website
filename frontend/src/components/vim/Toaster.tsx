"use client";
import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import { type Toast, dismissToast, toasts } from "./toast";

function ToastCard({ toast }: { toast: Toast }) {
    const [paused, setPaused] = useState(false);
    const remaining = useRef(toast.duration);
    const startedAt = useRef(0);

    useEffect(() => {
        if (paused) return;
        startedAt.current = Date.now();
        const timer = window.setTimeout(
            () => dismissToast(toast.id),
            remaining.current,
        );
        return () => {
            window.clearTimeout(timer);
            remaining.current -= Date.now() - startedAt.current;
        };
    }, [paused, toast.id]);

    return (
        <li
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className={cx(
                "pointer-events-auto relative w-full overflow-hidden rounded-xl border bg-surface p-3 pr-8 shadow-float backdrop-blur-xl motion-safe:animate-pop-in",
                toast.tone === "error"
                    ? "border-line-strong"
                    : toast.tone === "egg"
                      ? "border-accent/40"
                      : "border-line",
            )}
        >
            {toast.title && (
                <p
                    className={cx(
                        "mb-1 font-mono text-[11px]",
                        toast.tone === "egg" ? "text-accent" : "text-ink-faint",
                    )}
                >
                    {toast.title}
                </p>
            )}
            {toast.text && (
                <p
                    className={cx(
                        "text-sm leading-snug",
                        toast.tone === "error"
                            ? "font-mono text-[13px] text-ink"
                            : "text-ink-soft",
                    )}
                >
                    {toast.text}
                </p>
            )}
            {toast.art && (
                <pre className="overflow-x-auto font-mono text-[11px] leading-[1.35] text-ink-soft">
                    {toast.art}
                </pre>
            )}
            <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss"
                className="absolute top-2 right-2 rounded-md px-1.5 font-mono text-xs text-ink-faint transition-colors hover:text-ink"
            >
                ×
            </button>
        </li>
    );
}

/** Top-right stack (nvim-notify's spot) for command output and Easter-egg announcements. */
export default function Toaster() {
    const items = toasts.useValue();
    return (
        <ol
            aria-live="polite"
            aria-label="Notifications"
            className="pointer-events-none fixed top-16 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
        >
            {items.map((toast) => (
                <ToastCard key={toast.id} toast={toast} />
            ))}
        </ol>
    );
}
