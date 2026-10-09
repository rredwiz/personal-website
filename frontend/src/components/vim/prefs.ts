"use client";
import { useSyncExternalStore } from "react";

/*
 * Browser-only state read with useSyncExternalStore: the server renders the
 * default snapshot and the client catches up after hydration, without a
 * mismatch and without setState-in-effect.
 */

const KEYS_STORAGE_KEY = "vim-keys";
const KEYS_EVENT = "vim-keys-change";

function subscribeToKeys(onChange: () => void): () => void {
    window.addEventListener("storage", onChange);
    window.addEventListener(KEYS_EVENT, onChange);
    return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(KEYS_EVENT, onChange);
    };
}

function readKeysEnabled(): boolean {
    try {
        return window.localStorage.getItem(KEYS_STORAGE_KEY) !== "off";
    } catch {
        return true;
    }
}

/** Whether the single-key Vim shortcuts are on (they can be turned off; WCAG 2.1.4). */
export function useVimKeysEnabled(): boolean {
    return useSyncExternalStore(subscribeToKeys, readKeysEnabled, () => true);
}

export function setVimKeysEnabled(enabled: boolean): void {
    try {
        if (enabled) window.localStorage.removeItem(KEYS_STORAGE_KEY);
        else window.localStorage.setItem(KEYS_STORAGE_KEY, "off");
    } catch {
        // Storage blocked (private mode etc.): the toggle just won't persist.
    }
    window.dispatchEvent(new Event(KEYS_EVENT));
}

function subscribeToScroll(onChange: () => void): () => void {
    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange);
    return () => {
        window.removeEventListener("scroll", onChange);
        window.removeEventListener("resize", onChange);
    };
}

/** Vim's ruler position: "All" when everything fits, else "Top", "Bot" or "42%". */
export function scrollPosition(
    scrollY: number,
    viewportHeight: number,
    documentHeight: number,
): string {
    const scrollable = documentHeight - viewportHeight;
    if (scrollable <= 1) return "All";
    if (scrollY <= 1) return "Top";
    if (scrollY >= scrollable - 1) return "Bot";
    return `${Math.round((scrollY / scrollable) * 100)}%`;
}

function readScrollPosition(): string {
    return scrollPosition(
        window.scrollY,
        window.innerHeight,
        document.documentElement.scrollHeight,
    );
}

export function useScrollPosition(): string {
    return useSyncExternalStore(
        subscribeToScroll,
        readScrollPosition,
        () => "All",
    );
}
