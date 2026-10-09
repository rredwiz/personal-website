"use client";
import { createStore } from "./store";

/** A message in the corner, like nvim-notify. `art` is shown preformatted (cowsay, ls, ...). */
export interface Toast {
    id: number;
    title?: string;
    text?: string;
    art?: string;
    tone?: "info" | "error" | "egg";
    /** How long it stays up, in ms. */
    duration: number;
}

export type ToastInput = Omit<Toast, "id" | "duration"> & { duration?: number };

const MAX_VISIBLE = 4;
let nextId = 1;

export const toasts = createStore<Toast[]>([]);

export function pushToast(input: ToastInput): number {
    const id = nextId++;
    const duration = input.duration ?? (input.art ? 9000 : 4500);
    toasts.set((current) =>
        [...current, { ...input, id, duration }].slice(-MAX_VISIBLE),
    );
    return id;
}

export function dismissToast(id: number): void {
    toasts.set((current) => current.filter((toast) => toast.id !== id));
}
