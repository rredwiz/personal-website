import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ExternalLink, { INLINE_LINK_CLASS } from "@/components/ui/ExternalLink";

describe("ExternalLink", () => {
    it("opens in a new tab with a safe rel", () => {
        render(<ExternalLink href="https://example.test">docs</ExternalLink>);
        const link = screen.getByRole("link", { name: "docs" });
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
        expect(link).not.toHaveClass("underline");
    });

    it("adds the running-text style when inline", () => {
        render(
            <ExternalLink inline href="https://example.test" className="extra">
                docs
            </ExternalLink>,
        );
        const link = screen.getByRole("link", { name: "docs" });
        for (const cls of INLINE_LINK_CLASS.split(" ")) {
            expect(link).toHaveClass(cls);
        }
        expect(link).toHaveClass("extra");
    });
});
