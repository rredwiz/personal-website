import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NotFound from "@/app/not-found";

vi.mock("next/navigation", () => ({ usePathname: () => "/nope" }));

describe("not-found page", () => {
    it("explains the 404 in Vim's words and links back home", () => {
        render(<NotFound />);
        expect(
            screen.getByRole("heading", { level: 1, name: "Nothing here." }),
        ).toBeInTheDocument();
        expect(
            screen.getByText("E484: Can't open file ~/nope"),
        ).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute(
            "href",
            "/",
        );
    });
});
