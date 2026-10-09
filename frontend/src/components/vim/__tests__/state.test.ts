import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
    COLORSCHEME_BOOT_SCRIPT,
    applyColorscheme,
    colorscheme,
} from "@/components/vim/colorschemes";
import { EGGS, foundEggs, resetEggs, unlockEgg } from "@/components/vim/eggs";
import { createStore } from "@/components/vim/store";
import { dismissToast, pushToast, toasts } from "@/components/vim/toast";

beforeEach(() => {
    window.localStorage.clear();
    toasts.set([]);
    resetEggs();
});

afterEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
});

describe("createStore", () => {
    it("persists through the given (de)serializer and ignores bad data", () => {
        window.localStorage.setItem("probe", "41");
        const store = createStore(0, {
            key: "probe",
            parse: (raw) => (/^\d+$/.test(raw) ? Number(raw) : undefined),
            serialize: (value) => (value === 0 ? null : String(value)),
        });
        expect(store.get()).toBe(41);
        store.set((value) => value + 1);
        expect(window.localStorage.getItem("probe")).toBe("42");
        store.set(0);
        expect(window.localStorage.getItem("probe")).toBeNull();

        window.localStorage.setItem("probe2", "garbage");
        const other = createStore(7, {
            key: "probe2",
            parse: (raw) => (/^\d+$/.test(raw) ? Number(raw) : undefined),
            serialize: String,
        });
        expect(other.get()).toBe(7);
    });

    it("notifies subscribers", () => {
        const store = createStore("a");
        let calls = 0;
        const unsubscribe = store.subscribe(() => calls++);
        store.set("b");
        unsubscribe();
        store.set("c");
        expect(calls).toBe(1);
    });
});

describe("toasts", () => {
    it("pushes, caps the stack at four and dismisses by id", () => {
        const ids = [1, 2, 3, 4, 5].map((n) => pushToast({ text: `t${n}` }));
        expect(toasts.get().map((t) => t.text)).toEqual([
            "t2",
            "t3",
            "t4",
            "t5",
        ]);
        dismissToast(ids[2]);
        expect(toasts.get().map((t) => t.text)).toEqual(["t2", "t4", "t5"]);
    });

    it("keeps ASCII art up longer", () => {
        pushToast({ text: "short" });
        pushToast({ art: "(__)" });
        const [plain, art] = toasts.get();
        expect(art.duration).toBeGreaterThan(plain.duration);
    });
});

describe("Easter eggs", () => {
    it("has thirty, all with unique ids and a hint", () => {
        expect(EGGS).toHaveLength(30);
        expect(new Set(EGGS.map((egg) => egg.id)).size).toBe(30);
        expect(EGGS.every((egg) => egg.hint.length > 0)).toBe(true);
    });

    it("announces a new egg once, remembers it and counts", () => {
        expect(unlockEgg("konami")).toBe(true);
        expect(unlockEgg("konami")).toBe(false);
        expect(foundEggs.get()).toEqual(["konami"]);
        expect(window.localStorage.getItem("vim-eggs")).toBe('["konami"]');
        const [toast] = toasts.get();
        expect(toast).toMatchObject({
            tone: "egg",
            title: "Easter egg 1/30",
            text: "Entered the code. Type :eggs to see them all.",
        });

        unlockEgg("smile");
        expect(toasts.get().at(-1)?.text).toBe("Made Vim smile.");
        resetEggs();
        expect(foundEggs.get()).toEqual([]);
        expect(window.localStorage.getItem("vim-eggs")).toBeNull();
    });
});

describe("colorschemes", () => {
    it("applies a scheme to <html> and persists it; default clears both", () => {
        applyColorscheme("nord");
        expect(document.documentElement.dataset.theme).toBe("nord");
        expect(colorscheme.get()).toBe("nord");
        expect(window.localStorage.getItem("vim-colorscheme")).toBe("nord");

        applyColorscheme("default");
        expect(document.documentElement.dataset.theme).toBeUndefined();
        expect(window.localStorage.getItem("vim-colorscheme")).toBeNull();
    });

    it("boots a saved scheme before paint, and only known ones", () => {
        window.localStorage.setItem("vim-colorscheme", "dracula");
        new Function(COLORSCHEME_BOOT_SCRIPT)();
        expect(document.documentElement.dataset.theme).toBe("dracula");

        delete document.documentElement.dataset.theme;
        window.localStorage.setItem("vim-colorscheme", "evil</script>");
        new Function(COLORSCHEME_BOOT_SCRIPT)();
        expect(document.documentElement.dataset.theme).toBeUndefined();
    });
});
