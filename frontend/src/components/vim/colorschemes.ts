"use client";
import { createStore } from "./store";

/**
 * `:colorscheme <name>`. The palettes themselves are CSS (html[data-theme] in
 * globals.css); this is the list, the silk shader colour for each, and the
 * persisted choice. The inline script in layout.tsx applies a saved scheme
 * before first paint.
 */
export const COLORSCHEMES = {
    default: { label: "slate (default)", silk: "#272a2f" },
    gruvbox: { label: "gruvbox", silk: "#3c3836" },
    nord: { label: "nord", silk: "#3b4252" },
    catppuccin: { label: "catppuccin mocha", silk: "#313244" },
    tokyonight: { label: "tokyonight", silk: "#292e42" },
    rosepine: { label: "rosé pine", silk: "#26233a" },
    dracula: { label: "dracula", silk: "#44475a" },
    solarized: { label: "solarized dark", silk: "#0b4352" },
    everforest: { label: "everforest", silk: "#3d484d" },
} as const;

export type ColorschemeName = keyof typeof COLORSCHEMES;

export const COLORSCHEME_STORAGE_KEY = "vim-colorscheme";

export function isColorscheme(name: string): name is ColorschemeName {
    return Object.prototype.hasOwnProperty.call(COLORSCHEMES, name);
}

export const colorscheme = createStore<ColorschemeName>("default", {
    key: COLORSCHEME_STORAGE_KEY,
    parse: (raw) => (isColorscheme(raw) ? raw : undefined),
    serialize: (value) => (value === "default" ? null : value),
});

export function applyColorscheme(name: ColorschemeName): void {
    colorscheme.set(name);
    const root = document.documentElement;
    if (name === "default") delete root.dataset.theme;
    else root.dataset.theme = name;
}

/** Runs before first paint (inlined in layout.tsx) so a saved scheme never flashes. */
export const COLORSCHEME_BOOT_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(
    COLORSCHEME_STORAGE_KEY,
)});if(t&&${JSON.stringify(Object.keys(COLORSCHEMES))}.indexOf(t)>0)document.documentElement.dataset.theme=t}catch(e){}`;
