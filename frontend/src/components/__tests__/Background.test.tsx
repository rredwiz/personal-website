import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Background from "@/components/background/Background";

const supportsWebGL = vi.hoisted(() => vi.fn<() => boolean>());
const silkMode = vi.hoisted(() => ({ throwOnRender: false }));
const reducedMotion = vi.hoisted(() => ({ value: false }));

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
vi.mock("motion/react", () => ({
    useReducedMotion: () => reducedMotion.value,
}));

describe("Background", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        silkMode.throwOnRender = false;
        reducedMotion.value = false;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("is a fixed layer behind the page that fades the shader in after first paint", async () => {
        supportsWebGL.mockReturnValue(true);
        const { container } = render(<Background />);
        const layer = container.firstChild;

        await act(async () => {});
        // First paint: flat colour only, nothing mounted yet.
        expect(screen.queryByTestId("silk")).not.toBeInTheDocument();
        expect(layer).toHaveClass("fixed", "-z-10", "opacity-0");
        expect(layer).toHaveAttribute("aria-hidden", "true");

        await act(async () => {
            vi.advanceTimersByTime(250);
        });
        expect(screen.getByTestId("silk")).toHaveAttribute("data-speed", "4");
        expect(screen.getByTestId("silk")).toHaveAttribute(
            "data-frameloop",
            "always",
        );
        expect(layer).toHaveClass("opacity-100", "transition-opacity");
    });

    it("holds the shader still for reduced motion", async () => {
        supportsWebGL.mockReturnValue(true);
        reducedMotion.value = true;
        render(<Background />);
        await act(async () => {
            vi.advanceTimersByTime(250);
        });
        expect(screen.getByTestId("silk")).toHaveAttribute("data-speed", "0");
        expect(screen.getByTestId("silk")).toHaveAttribute(
            "data-frameloop",
            "demand",
        );
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
        // The timer is what probes for WebGL, so it never fired.
        expect(supportsWebGL).not.toHaveBeenCalled();
    });
});
