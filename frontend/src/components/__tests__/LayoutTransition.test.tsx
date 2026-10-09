import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LayoutTransition from "@/components/animations/LayoutTransition";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
// FrozenRoute depends on a Next.js-internal context; pass children straight through here.
vi.mock("@/components/animations/FrozenRoute", () => ({
    default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("LayoutTransition", () => {
    it("renders the page and never leaves the body scroll-locked after unmount", () => {
        document.body.style.overflowY = "hidden";
        const { unmount } = render(
            <LayoutTransition>
                <p>page content</p>
            </LayoutTransition>,
        );
        expect(screen.getByText("page content")).toBeInTheDocument();

        unmount();
        expect(document.body.style.overflowY).toBe("");
        // The layout's overflow-x-hidden is a class, so inline overflow-x must stay untouched.
        expect(document.body.style.overflowX).toBe("");
    });
});
