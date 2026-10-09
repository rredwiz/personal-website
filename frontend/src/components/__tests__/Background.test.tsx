import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Background from "@/components/background/Background";

const supportsWebGL = vi.hoisted(() => vi.fn<() => boolean>());
const silkMode = vi.hoisted(() => ({ throwOnRender: false }));

vi.mock("@/lib/webgl", () => ({ supportsWebGL }));
vi.mock("@/components/background/Silk", () => ({
    default: (props: { speed: number; frameloop: string }) => {
        if (silkMode.throwOnRender) throw new Error("WebGL context lost");
        return (
            <div
                data-testid="silk"
                data-speed={props.speed}
                data-frameloop={props.frameloop}
            />
        );
    },
}));
vi.mock("motion/react", () => ({ useReducedMotion: () => false }));

describe("Background", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        silkMode.throwOnRender = false;
        document.body.className = "bg-[#232323]";
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders the shader when WebGL is available and fades it in after first paint", async () => {
        supportsWebGL.mockReturnValue(true);
        const { container } = render(<Background />);

        await act(async () => {});
        // First paint: flat colour only, nothing mounted yet.
        expect(screen.queryByTestId("silk")).not.toBeInTheDocument();
        expect(container.firstChild).toHaveClass("opacity-0");
        expect(document.body.classList.contains("bg-[#232323]")).toBe(true);

        await act(async () => {
            vi.advanceTimersByTime(250);
        });
        expect(screen.getByTestId("silk")).toHaveAttribute("data-speed", "5");
        expect(screen.getByTestId("silk")).toHaveAttribute(
            "data-frameloop",
            "always",
        );
        expect(container.firstChild).toHaveClass(
            "opacity-100",
            "transition-opacity",
        );
        expect(document.body.classList.contains("bg-[#232323]")).toBe(false);
    });

    it("skips the shader entirely without WebGL", async () => {
        supportsWebGL.mockReturnValue(false);
        render(<Background />);
        await act(async () => {
            vi.advanceTimersByTime(250);
        });
        expect(supportsWebGL).toHaveBeenCalled();
        expect(screen.queryByTestId("silk")).not.toBeInTheDocument();
    });

    it("survives the shader throwing instead of blanking the page", async () => {
        supportsWebGL.mockReturnValue(true);
        silkMode.throwOnRender = true;
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.spyOn(console, "warn").mockImplementation(() => {});

        const { container } = render(<Background />);
        await act(async () => {
            vi.advanceTimersByTime(250);
        });

        expect(container.firstChild).toBeInTheDocument();
        expect(screen.queryByTestId("silk")).not.toBeInTheDocument();
        expect(console.warn).toHaveBeenCalled();
    });

    it("clears the fade-in timer on unmount", () => {
        supportsWebGL.mockReturnValue(false);
        const { unmount } = render(<Background />);
        unmount();
        act(() => {
            vi.advanceTimersByTime(250);
        });
        // Body class is untouched because the timer never fired.
        expect(document.body.classList.contains("bg-[#232323]")).toBe(true);
    });
});
