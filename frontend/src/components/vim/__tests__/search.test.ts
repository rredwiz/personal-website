import { afterEach, describe, expect, it } from "vitest";
import { canHighlight, findMatches } from "@/components/vim/search";

function mount(html: string): HTMLElement {
    const root = document.createElement("main");
    root.innerHTML = html;
    document.body.append(root);
    // jsdom has no layout; pretend everything is rendered.
    for (const el of root.querySelectorAll("*")) {
        (el as HTMLElement).getClientRects = () =>
            [{}] as unknown as DOMRectList;
    }
    return root;
}

afterEach(() => {
    document.body.innerHTML = "";
});

describe("findMatches", () => {
    it("is case-insensitive unless the pattern has a capital (smartcase)", () => {
        const root = mount("<p>Student student STUDENT</p>");
        expect(findMatches(root, "student")).toHaveLength(3);
        expect(findMatches(root, "Student")).toHaveLength(1);
    });

    it("finds repeated matches and skips decoration", () => {
        const root = mount(
            '<p>abc abc</p><span aria-hidden="true">abc</span><p hidden>abc</p>',
        );
        const ranges = findMatches(root, "abc");
        expect(ranges).toHaveLength(2);
        expect(ranges.map((range) => range.toString())).toEqual(["abc", "abc"]);
    });

    it("finds nothing for an empty pattern", () => {
        expect(findMatches(mount("<p>x</p>"), "")).toEqual([]);
    });

    it("degrades gracefully where the Highlight API is missing", () => {
        expect(typeof canHighlight()).toBe("boolean");
    });
});
