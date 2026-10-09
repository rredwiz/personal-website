import { describe, expect, it } from "vitest";
import { scrollPosition } from "@/components/vim/prefs";

describe("scrollPosition (Vim's ruler)", () => {
    it.each([
        [0, 800, 800, "All"],
        [0, 800, 801, "All"],
        [0, 800, 2000, "Top"],
        [1200, 800, 2000, "Bot"],
        [600, 800, 2000, "50%"],
        [300, 800, 2000, "25%"],
    ])("scrollY=%d viewport=%d doc=%d -> %s", (y, viewport, doc, expected) => {
        expect(scrollPosition(y, viewport, doc)).toBe(expected);
    });
});
