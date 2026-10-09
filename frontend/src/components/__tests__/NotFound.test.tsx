import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "@/app/not-found";

describe("not-found page", () => {
    it("explains the 404 and links back home", () => {
        render(<NotFound />);
        expect(
            screen.getByRole("heading", { level: 1, name: "Nothing here." }),
        ).toBeInTheDocument();
        expect(screen.getByText("404", { selector: "p" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute(
            "href",
            "/",
        );
    });
});
