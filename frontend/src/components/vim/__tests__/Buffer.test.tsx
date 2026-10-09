import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Buffer, Cursor } from "@/components/vim/Buffer";

describe("Buffer", () => {
    it("numbers each line and keeps the numbers out of the accessible text", () => {
        const { container } = render(
            <Buffer
                lines={[
                    <h2 key="h">About Me</h2>,
                    null,
                    <p key="p">Body text.</p>,
                ]}
            />,
        );
        expect(
            screen.getByRole("heading", { name: "About Me" }),
        ).toBeInTheDocument();
        expect(screen.getByText("Body text.")).toBeInTheDocument();
        const numbers = [
            ...container.querySelectorAll('[aria-hidden="true"]'),
        ].map((el) => el.textContent);
        expect(numbers.slice(0, 3)).toEqual(["1", "2", "3"]);
        // The ~ filler is decoration too: hidden from assistive tech, tildes only.
        const hidden = container.querySelectorAll('[aria-hidden="true"]');
        const filler = hidden[hidden.length - 1];
        expect(filler.textContent).toMatch(/^~+$/);
    });

    it("renders a decorative cursor", () => {
        const { container } = render(<Cursor />);
        expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    });
});
