import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProjectCard from "@/components/ProjectCard";

describe("ProjectCard", () => {
    it("renders the project as a real, keyboard-reachable external link", () => {
        render(<ProjectCard header="Timer App" desc="An Electron timer." url="https://github.com/rredwiz/timer-app" />);

        const link = screen.getByRole("link", { name: /open timer app/i });
        expect(link).toHaveAttribute("href", "https://github.com/rredwiz/timer-app");
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
        expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Timer App");
        expect(screen.getByText("An Electron timer.")).toBeInTheDocument();
    });

    it("falls back to placeholder copy", () => {
        render(<ProjectCard url="https://example.test" />);
        expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Work in progress...");
        expect(screen.getByText("Sample description...")).toBeInTheDocument();
        expect(screen.queryByRole("img", { name: /preview/i })).not.toBeInTheDocument();
    });

    it("shows an optional preview image", () => {
        render(<ProjectCard url="https://example.test" imageSrc="/timer-app-example2.png" imageAlt="Timer preview" />);
        expect(screen.getByRole("img", { name: "Timer preview" })).toHaveAttribute("src", "/timer-app-example2.png");
    });
});
