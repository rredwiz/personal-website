"use client";
import { createStore } from "./store";
import { pushToast } from "./toast";

/** Every Easter egg on the site, in the order `:eggs` lists them. */
export const EGGS = [
    {
        id: "quit",
        name: "Tried to quit Vim",
        hint: "Everyone tries eventually.",
    },
    {
        id: "help42",
        name: "Asked the big question",
        hint: ":help with a number",
    },
    { id: "grail", name: "Found the grail", hint: ":help holy-…" },
    { id: "panic", name: "Panicked politely", hint: ":help, but louder" },
    { id: "shrubbery", name: "Knights who say…", hint: ":Ni!" },
    { id: "smile", name: "Made Vim smile", hint: "Vim has a command for it." },
    { id: "colorscheme", name: "Changed the colorscheme", hint: ":colo…" },
    { id: "light", name: "Asked for light mode", hint: ":set background=…" },
    {
        id: "search",
        name: "Searched the buffer",
        hint: "Vim searches with a slash.",
    },
    { id: "delete", name: "Deleted a buffer", hint: "Two d's on a card." },
    { id: "insert", name: "Tried to type", hint: "i" },
    { id: "visual", name: "Saw things visually", hint: "v" },
    { id: "beep", name: "Made Vim beep", hint: "Escape. Escape. Escape." },
    { id: "explore", name: "Explored the filesystem", hint: ":Ex" },
    {
        id: "secrets",
        name: "Went looking for secrets",
        hint: "Some files are private.",
    },
    { id: "substitute", name: "Tried to rewrite history", hint: ":%s/…" },
    { id: "root", name: "Asked for root", hint: ":!sudo …" },
    { id: "neofetch", name: "Flexed the setup", hint: ":!neofetch" },
    { id: "train", name: "Caught the train", hint: "Typo of ls." },
    { id: "cowsay", name: "Let the cow speak", hint: ":!cowsay moo" },
    { id: "emacs", name: "Said the E-word", hint: "The other editor." },
    { id: "name", name: "Typed my name", hint: "Just type it." },
    { id: "konami", name: "Entered the code", hint: "↑ ↑ ↓ ↓ ← → ← → …" },
    { id: "avatar", name: "Poked the avatar", hint: "Click me. A lot." },
    {
        id: "cool",
        name: "Made the owner cooler",
        hint: "Agree with the status line.",
    },
    { id: "speed", name: "Asked about the speed", hint: "Click the wpm." },
    { id: "yank", name: "Yanked some text", hint: "Copy anything." },
    { id: "lost", name: "Got lost", hint: "Visit a page that doesn't exist." },
    {
        id: "console",
        name: "Opened the hood",
        hint: "Developers have a console.",
    },
    {
        id: "nightowl",
        name: "Night owl",
        hint: "Visit between midnight and 5 a.m.",
    },
] as const;

export type EggId = (typeof EGGS)[number]["id"];

const KNOWN = new Set<string>(EGGS.map((egg) => egg.id));

export const foundEggs = createStore<readonly EggId[]>([], {
    key: "vim-eggs",
    parse: (raw) => {
        const list: unknown = JSON.parse(raw);
        return Array.isArray(list)
            ? (list.filter(
                  (id) => typeof id === "string" && KNOWN.has(id),
              ) as EggId[])
            : undefined;
    },
    serialize: (value) => (value.length ? JSON.stringify(value) : null),
});

/** Record an egg. Announces it the first time; returns whether it was new. */
export function unlockEgg(id: EggId): boolean {
    if (foundEggs.get().includes(id)) return false;
    foundEggs.set((current) => [...current, id]);
    const egg = EGGS.find((candidate) => candidate.id === id)!;
    const count = foundEggs.get().length;
    pushToast({
        tone: "egg",
        title: `Easter egg ${count}/${EGGS.length}`,
        // The tip only matters once.
        text:
            count === 1
                ? `${egg.name}. Type :eggs to see them all.`
                : `${egg.name}.`,
    });
    return true;
}

export function resetEggs(): void {
    foundEggs.set([]);
}
