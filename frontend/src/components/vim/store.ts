"use client";
import { useSyncExternalStore } from "react";

/**
 * A tiny external store, optionally persisted to localStorage. Read with
 * useSyncExternalStore so the server render (which always sees `initial`)
 * and hydration agree, with no setState-in-effect.
 */
export interface Store<T> {
    get(): T;
    set(value: T | ((current: T) => T)): void;
    subscribe(onChange: () => void): () => void;
    useValue(): T;
}

export function createStore<T>(
    initial: T,
    persist?: {
        key: string;
        parse: (raw: string) => T | undefined;
        serialize: (value: T) => string | null;
    },
): Store<T> {
    let value = initial;
    let hydrated = !persist;
    const listeners = new Set<() => void>();

    const hydrate = () => {
        if (hydrated || typeof window === "undefined") return;
        hydrated = true;
        try {
            const raw = window.localStorage.getItem(persist!.key);
            const parsed = raw === null ? undefined : persist!.parse(raw);
            if (parsed !== undefined) value = parsed;
        } catch {
            // Storage blocked: keep the default.
        }
    };

    const store: Store<T> = {
        get() {
            hydrate();
            return value;
        },
        set(next) {
            hydrate();
            value =
                typeof next === "function"
                    ? (next as (current: T) => T)(value)
                    : next;
            if (persist && typeof window !== "undefined") {
                try {
                    const raw = persist.serialize(value);
                    if (raw === null)
                        window.localStorage.removeItem(persist.key);
                    else window.localStorage.setItem(persist.key, raw);
                } catch {
                    // Storage blocked: the change just won't persist.
                }
            }
            listeners.forEach((listener) => listener());
        },
        subscribe(onChange) {
            listeners.add(onChange);
            return () => listeners.delete(onChange);
        },
        useValue() {
            return useSyncExternalStore(
                store.subscribe,
                store.get,
                () => initial,
            );
        },
    };
    return store;
}
