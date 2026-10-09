import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VimShell from "@/components/vim/VimShell";
import { KONAMI_EVENT } from "@/components/vim/events";
import { foundEggs, resetEggs } from "@/components/vim/eggs";
import { toasts } from "@/components/vim/toast";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push }),
    usePathname: () => "/",
}));
vi.mock("motion/react", () => ({ useReducedMotion: () => true }));

function press(key: string, init: KeyboardEventInit = {}) {
    act(() => {
        fireEvent.keyDown(window, { key, ...init });
    });
}

function typeCommand(text: string) {
    press(":");
    const input = screen.getByRole("combobox", { name: "Vim command" });
    fireEvent.change(input, { target: { value: text } });
    act(() => {
        fireEvent.keyDown(input, { key: "Enter" });
    });
}

function renderShell() {
    return render(
        <>
            <main>
                <div data-card="" data-testid="card">
                    A card about a student.
                </div>
            </main>
            <VimShell />
        </>,
    );
}

const toastText = () =>
    within(screen.getByRole("list", { name: "Notifications" }))
        .queryAllByRole("listitem")
        .map((item) => item.textContent ?? "");

describe("VimShell", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        window.localStorage.clear();
        window.sessionStorage.setItem("vim-nightowl", "1");
        resetEggs();
        toasts.set([]);
        push.mockClear();
        window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
        window.scrollBy = vi.fn() as unknown as typeof window.scrollBy;
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        window.localStorage.clear();
    });

    it("shows the mode and the resting message", () => {
        renderShell();
        expect(screen.getByText("NORMAL")).toBeInTheDocument();
        expect(
            screen.getByRole("button", {
                name: "This site owner is extremely cool.",
            }),
        ).toBeInTheDocument();
    });

    it("runs : commands, with toasts and Easter eggs", () => {
        renderShell();
        typeCommand("q");
        expect(toastText().some((text) => text.includes("E37"))).toBe(true);
        expect(foundEggs.get()).toContain("quit");
    });

    it("runs the suggestion when the typed command is only a prefix", () => {
        renderShell();
        typeCommand("proj");
        expect(push).toHaveBeenCalledWith("/projects");
    });

    it("opens the palette with ⌘K, even with single keys off", () => {
        window.localStorage.setItem("vim-keys", "off");
        renderShell();
        press(":");
        expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
        press("k", { metaKey: true });
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("deletes the hovered card with dd and restores it with u", () => {
        renderShell();
        const card = screen.getByTestId("card");
        fireEvent.pointerOver(card);
        press("d");
        press("d");
        act(() => {
            vi.runOnlyPendingTimers();
        });
        expect(card.hidden).toBe(true);
        expect(foundEggs.get()).toContain("delete");
        press("u");
        expect(card.hidden).toBe(false);
        press("u");
        expect(
            toastText().some((t) => t.includes("Already at oldest change")),
        ).toBe(true);
    });

    it("refuses to type in insert mode", () => {
        renderShell();
        press("i");
        expect(screen.getByText("INSERT")).toBeInTheDocument();
        expect(toastText().some((t) => t.includes("E21"))).toBe(true);
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(screen.getByText("NORMAL")).toBeInTheDocument();
    });

    it("beeps after three escapes", () => {
        renderShell();
        press("Escape");
        press("Escape");
        press("Escape");
        expect(foundEggs.get()).toContain("beep");
    });

    it("recognises the Konami code and typed words", () => {
        renderShell();
        const onKonami = vi.fn();
        window.addEventListener(KONAMI_EVENT, onKonami);
        for (const key of [
            "ArrowUp",
            "ArrowUp",
            "ArrowDown",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "ArrowLeft",
            "ArrowRight",
            "b",
            "a",
        ]) {
            press(key);
        }
        expect(onKonami).toHaveBeenCalledTimes(1);
        expect(foundEggs.get()).toContain("konami");
        window.removeEventListener(KONAMI_EVENT, onKonami);

        for (const key of "andrew") press(key);
        expect(foundEggs.get()).toContain("name");
    });

    it("gets cooler the more you agree", () => {
        renderShell();
        const message = () =>
            screen.getByRole("button", { name: /This site owner is/ });
        act(() => {
            fireEvent.click(message());
        });
        expect(message()).toHaveTextContent(
            "This site owner is extremely extremely cool.",
        );
        act(() => {
            fireEvent.click(message());
        });
        expect(foundEggs.get()).toContain("cool");
    });

    it("toggles help with ? and leaves keys typed into fields alone", () => {
        renderShell();
        press("?");
        expect(
            screen.getByRole("region", { name: "Keyboard help" }),
        ).toBeInTheDocument();
        press("?");
        expect(
            screen.queryByRole("region", { name: "Keyboard help" }),
        ).not.toBeInTheDocument();

        const field = document.createElement("input");
        document.body.append(field);
        act(() => {
            fireEvent.keyDown(field, { key: "j" });
            fireEvent.keyDown(window, { key: "j", ctrlKey: true });
        });
        expect(window.scrollBy).not.toHaveBeenCalled();
        field.remove();
    });

    it("treats copying text as a yank", () => {
        renderShell();
        const range = document.createRange();
        range.selectNodeContents(screen.getByTestId("card"));
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
        act(() => {
            document.dispatchEvent(new Event("copy"));
        });
        expect(toastText().some((t) => t.includes("characters yanked"))).toBe(
            true,
        );
        expect(foundEggs.get()).toContain("yank");
    });

    it("exposes the console egg", () => {
        renderShell();
        expect(window.andrew?.()).toContain("console egg");
        expect(foundEggs.get()).toContain("console");
    });
});
