import { afterEach, describe, expect, it, vi } from "vitest";
import { supportsWebGL } from "@/lib/webgl";

describe("supportsWebGL", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("is false when no WebGL context can be created", () => {
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
        expect(supportsWebGL()).toBe(false);
    });

    it("is true when a context is available", () => {
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
            (type: string) => (type === "webgl2" ? ({} as unknown as RenderingContext) : null),
        );
        expect(supportsWebGL()).toBe(true);
    });

    it("falls back to older context names", () => {
        const getContext = vi
            .spyOn(HTMLCanvasElement.prototype, "getContext")
            .mockImplementation((type: string) => (type === "webgl" ? ({} as unknown as RenderingContext) : null));
        expect(supportsWebGL()).toBe(true);
        expect(getContext).toHaveBeenCalledWith("webgl2");
        expect(getContext).toHaveBeenCalledWith("webgl");
    });

    it("is false when getContext throws", () => {
        vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => {
            throw new Error("blocked");
        });
        expect(supportsWebGL()).toBe(false);
    });
});
