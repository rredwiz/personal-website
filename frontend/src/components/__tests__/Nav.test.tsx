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

        expect(screen.getByRole("navigation", { name: "Primary" })).toHaveClass(
            "nav-class",
        );
        expect(screen.getByRole("link", { name: "projects" })).toHaveAttribute(
            "aria-current",
            "page",
        );
        expect(screen.getByRole("link", { name: "home" })).not.toHaveAttribute(
            "aria-current",
        );
    });

    it("shows Vim tab labels while naming links plainly", () => {
        usePathname.mockReturnValue("/");
        render(<Nav />);
        const home = screen.getByRole("link", { name: "home" });
        // Visible "1 home.md": the number and extension are decoration.
        expect(home).toHaveTextContent("1home.md");
    });

    it("marks home on the root path", () => {
        usePathname.mockReturnValue("/");
        render(<Nav />);
        expect(screen.getByRole("link", { name: "home" })).toHaveAttribute(
            "aria-current",
            "page",
        );
        expect(screen.getByRole("link", { name: "home" })).toHaveAttribute(
            "href",
            "/",
        );
        expect(screen.getByRole("link", { name: "projects" })).toHaveAttribute(
            "href",
            "/projects",
        );
    });
});
