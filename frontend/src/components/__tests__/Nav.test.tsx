import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Nav, { isActivePath } from "@/components/navigation/Nav";

const usePathname = vi.hoisted(() => vi.fn<() => string | null>());

vi.mock("next/navigation", () => ({ usePathname }));

describe("isActivePath", () => {
    it("matches home exactly and sections by prefix", () => {
        expect(isActivePath("/", "/")).toBe(true);
        expect(isActivePath("/projects", "/")).toBe(false);
        expect(isActivePath("/projects", "/projects")).toBe(true);
        expect(isActivePath("/projects/foo", "/projects")).toBe(true);
        expect(isActivePath("/projectsx", "/projects")).toBe(false);
        expect(isActivePath(null, "/")).toBe(false);
    });
});

describe("Nav", () => {
    it("marks the current page (this used to be dead code: the page prop was never passed)", () => {
        usePathname.mockReturnValue("/projects");
        render(<Nav className="nav-class" />);

        expect(screen.getByRole("navigation", { name: "Primary" })).toHaveClass("nav-class");
        expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("aria-current", "page");
        expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    });

    it("marks home on the root path", () => {
        usePathname.mockReturnValue("/");
        render(<Nav />);
        expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
        expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
        expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/projects");
    });
});
