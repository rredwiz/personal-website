import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CommandPalette from "@/components/vim/CommandPalette";

function setup(mode: ":" | "/" = ":") {
    const handlers = {
        onRun: vi.fn(),
        onSearchPreview: vi.fn(),
        onClose: vi.fn(),
    };
    render(
        <CommandPalette
            mode={mode}
            eggsFound={0}
            colorscheme="default"
            {...handlers}
        />,
    );
    const input = screen.getByRole("combobox");
    const key = (k: string) =>
        act(() => {
            fireEvent.keyDown(input, { key: k });
        });
    const type = (value: string) =>
        fireEvent.change(input, { target: { value } });
    return { ...handlers, input, key, type };
}

describe("CommandPalette", () => {
    it("focuses the input and suggests public commands", () => {
        const { input, type } = setup();
        expect(input).toHaveFocus();
        type("git");
        expect(screen.getByRole("option", { name: /:github/ })).toHaveAttribute(
            "aria-selected",
            "true",
        );
    });

    it("runs what was typed, offering the top suggestion as a fallback", () => {
        const { type, key, onRun } = setup();
        type("proj");
        key("Enter");
        expect(onRun).toHaveBeenCalledWith("proj", "projects");
    });

    it("runs the highlighted suggestion after arrowing to it", () => {
        const { type, key, onRun, input } = setup();
        type("t");
        key("ArrowDown");
        const active = input.getAttribute("aria-activedescendant");
        expect(active).toBeTruthy();
        key("Enter");
        expect(onRun).toHaveBeenCalledWith("tabprevious");
    });

    it("completes with Tab, leaving room for an argument", () => {
        const { type, key, input } = setup();
        type("colo");
        key("Tab");
        expect(input).toHaveValue("colorscheme ");
        expect(
            screen.getByRole("option", { name: /colorscheme gruvbox/ }),
        ).toBeInTheDocument();
    });

    it("closes on Escape or Backspace on an empty line", () => {
        const { key, onClose } = setup();
        key("Backspace");
        expect(onClose).toHaveBeenCalledTimes(1);
        key("Escape");
        expect(onClose).toHaveBeenCalledTimes(2);
    });

    it("previews matches while typing a / search", () => {
        const { type, key, onSearchPreview, onRun } = setup("/");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        type("stud");
        expect(onSearchPreview).toHaveBeenLastCalledWith("stud");
        key("Enter");
        expect(onRun).toHaveBeenCalledWith("stud");
    });
});
