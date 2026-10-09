import { describe, expect, it } from "vitest";
import { cx } from "@/lib/cx";

describe("cx", () => {
    it("joins truthy class names and skips the rest", () => {
        expect(cx("a", false, "b", null, undefined, "", "c")).toBe("a b c");
        expect(cx()).toBe("");
    });
});
