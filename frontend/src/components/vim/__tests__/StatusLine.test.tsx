import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StatusLine from "@/components/vim/StatusLine";

const push = vi.hoisted(() => vi.fn());
const pathname = vi.hoisted(() => ({ value: "/" }));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push }),
    usePathname: () => pathname.value,
}));
vi.mock("motion/react", () => ({ useReducedMotion: () => true }));

function press(key: string) {
    act(() => {
        fireEvent.keyDown(window, { key });
    });
}

function runCommand(text: string) {
    press(":");
    const input = screen.getByRole("textbox", { name: /vim command/i });
    fireEvent.change(input, { target: { value: text } });
    fireEvent.submit(input.closest("form")!);
}

describe("StatusLine", () => {
    beforeEach(() => {
        window.localStorage.clear();
        pathname.value = "/";
        window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
        window.scrollBy = vi.fn() as unknown as typeof window.scrollBy;
    });

    afterEach(() => {
        window.localStorage.clear();
    });

    it("shows the mode, the buffer and the resting message", () => {
        render(<StatusLine />);
        expect(screen.getByText("NORMAL")).toBeInTheDocument();
        expect(screen.getByText("~/home.md")).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent(
            "This site owner is extremely cool.",
        );
    });

    it("runs commands typed after :", () => {
        render(<StatusLine />);
        press(":");
        expect(screen.getByText("COMMAND")).toBeInTheDocument();
        expect(
            screen.getByRole("textbox", { name: /vim command/i }),
        ).toHaveFocus();

        runCommand("projects");
        expect(push).toHaveBeenCalledWith("/projects");
        expect(screen.getByRole("status")).toHaveTextContent(
            '"~/projects.md" [readonly]',
        );

        runCommand("q");
        expect(screen.getByRole("status")).toHaveTextContent(/^E37/);
    });

    it("handles j/k, gg/G and gt", () => {
        render(<StatusLine />);
        press("j");
        expect(window.scrollBy).toHaveBeenCalledWith({
            top: 80,
            behavior: "auto",
        });
        press("G");
        expect(window.scrollTo).toHaveBeenCalled();
        press("g");
        press("g");
        expect(window.scrollTo).toHaveBeenLastCalledWith({
            top: 0,
            behavior: "auto",
        });
        press("g");
        press("t");
        expect(push).toHaveBeenCalledWith("/projects");
    });

    it("leaves keys alone when they are typed into a field or use modifiers", () => {
        render(
            <>
                <input aria-label="elsewhere" />
                <StatusLine />
            </>,
        );
        const field = screen.getByRole("textbox", { name: "elsewhere" });
        act(() => {
            fireEvent.keyDown(field, { key: "j" });
            fireEvent.keyDown(window, { key: "j", metaKey: true });
        });
        expect(window.scrollBy).not.toHaveBeenCalled();
    });

    it("toggles help with ? and closes it with Escape", () => {
        render(<StatusLine />);
        press("?");
        expect(
            screen.getByRole("region", { name: "Keyboard help" }),
        ).toBeInTheDocument();
        press("Escape");
        expect(
            screen.queryByRole("region", { name: "Keyboard help" }),
        ).not.toBeInTheDocument();
    });

    it("can switch the single-key shortcuts off (and remembers)", () => {
        render(<StatusLine />);
        const toggle = screen.getByRole("button", { name: "keys:on" });
        act(() => {
            fireEvent.click(toggle);
        });
        expect(
            screen.getByRole("button", { name: "keys:off" }),
        ).toHaveAttribute("aria-pressed", "false");
        expect(window.localStorage.getItem("vim-keys")).toBe("off");

        press("?");
        press("j");
        expect(
            screen.queryByRole("region", { name: "Keyboard help" }),
        ).not.toBeInTheDocument();
        expect(window.scrollBy).not.toHaveBeenCalled();

        // The command line still opens by click, so it can be turned back on.
        act(() => {
            fireEvent.click(
                screen.getByRole("button", { name: "Open the command line" }),
            );
        });
        runCommand("set keys");
        expect(window.localStorage.getItem("vim-keys")).toBeNull();
    });
});
