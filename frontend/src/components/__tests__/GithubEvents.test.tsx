import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GithubEvents, { formatEventDate } from "@/components/GithubEvents";

describe("formatEventDate", () => {
    it("formats ISO timestamps and leaves garbage alone", () => {
        expect(formatEventDate("2026-10-01T12:00:00Z")).toBe("Oct 1, 2026");
        expect(formatEventDate("not a date")).toBe("not a date");
    });
});

describe("GithubEvents", () => {
    it("links each push to its repo and commit", () => {
        render(
            <GithubEvents
                events={[
                    {
                        message: "fix: things",
                        repo_name: "rredwiz/personal-website",
                        repo_url: "https://github.com/rredwiz/personal-website",
                        commit_url:
                            "https://github.com/rredwiz/personal-website/commit/abc",
                        type: "PushEvent",
                        created_at: "2026-10-01T12:00:00Z",
                    },
                ]}
            />,
        );

        expect(
            screen.getByRole("link", { name: "rredwiz/personal-website" }),
        ).toHaveAttribute(
            "href",
            "https://github.com/rredwiz/personal-website",
        );
        expect(
            screen.getByRole("link", { name: "fix: things" }),
        ).toHaveAttribute(
            "href",
            "https://github.com/rredwiz/personal-website/commit/abc",
        );
        expect(screen.getByText("Oct 1, 2026")).toBeInTheDocument();
    });

    it("has an empty state", () => {
        render(<GithubEvents events={[]} />);
        expect(
            screen.getByText("No recent public activity."),
        ).toBeInTheDocument();
    });
});
