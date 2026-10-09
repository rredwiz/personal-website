import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotFound from "@/app/not-found";

describe("not-found page", () => {
    it("explains the 404 in Vim's words and links back home", () => {
        window.history.replaceState(null, "", "/nope");
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
