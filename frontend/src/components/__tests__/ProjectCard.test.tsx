import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProjectCard, { repoLabel } from "@/components/ProjectCard";

describe("ProjectCard", () => {
    it("renders the project as a real, keyboard-reachable external link", () => {
        render(
            <ProjectCard
                header="Timer App"
                desc="An Electron timer."
                url="https://github.com/rredwiz/timer-app"
            />,
        );

        const link = screen.getByRole("link", { name: /open timer app/i });
        expect(link).toHaveAttribute(
            "href",
            "https://github.com/rredwiz/timer-app",
        );
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
        expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
            "Timer App",
        );
        expect(screen.getByText("An Electron timer.")).toBeInTheDocument();
    });

    it("falls back to placeholder copy", () => {
        render(<ProjectCard url="https://example.test" />);
        expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
            "Work in progress...",
        );
        expect(screen.getByText("Sample description...")).toBeInTheDocument();
        expect(
            screen.queryByRole("img", { name: /preview/i }),
        ).not.toBeInTheDocument();
    });

    it("shows an optional preview image", () => {
        render(
            <ProjectCard
                url="https://example.test"
                imageSrc="/timer-app-example2.png"
                imageAlt="Timer preview"
            />,
        );
        expect(
            screen.getByRole("img", { name: "Timer preview" }),
        ).toHaveAttribute("src", "/timer-app-example2.png");
    });

    it("labels the card with the repo and lists what it was built with", () => {
        render(
            <ProjectCard
                header="Timer App"
                url="https://github.com/rredwiz/timer-app"
                tags={["Electron", "TypeScript"]}
            />,
        );
        expect(screen.getByText("rredwiz/timer-app")).toBeInTheDocument();
        const tags = screen.getByRole("list", { name: "Built with" });
        expect(tags).toHaveTextContent("Electron");
        expect(tags).toHaveTextContent("TypeScript");
    });

    it("omits the tag list when there are no tags", () => {
        render(<ProjectCard url="https://example.test" />);
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });
});

describe("repoLabel", () => {
    it("shortens GitHub URLs to owner/repo and other URLs to their host", () => {
        expect(repoLabel("https://github.com/rredwiz/alt-manager")).toBe(
            "rredwiz/alt-manager",
        );
        expect(repoLabel("https://github.com/rredwiz/timer-app/")).toBe(
            "rredwiz/timer-app",
        );
        expect(repoLabel("https://example.test/some/page")).toBe(
            "example.test",
        );
        expect(repoLabel("not a url")).toBe("not a url");
    });
});
