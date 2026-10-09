import type { HTMLAttributes } from "react";
import { renderToString } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MonkeyTypeStatsCard, {
    goalPercentage,
} from "@/components/MonkeyTypeStatsCard";

const motionPrefs = vi.hoisted(() => ({ reduced: false }));

type MotionDivProps = HTMLAttributes<HTMLDivElement> & {
    initial?: unknown;
    animate?: unknown;
    transition?: unknown;
    exit?: unknown;
};

// Jump straight to the end of the count-up so assertions don't depend on timers.
vi.mock("motion/react", async () => {
    const { forwardRef, createElement } = await import("react");
    const Div = forwardRef<HTMLDivElement, MotionDivProps>(function MotionDiv(
        { children, ...rest },
        ref,
    ) {
        // Motion-only props would end up as unknown DOM attributes.
        delete rest.initial;
        delete rest.animate;
        delete rest.transition;
        delete rest.exit;
        return createElement("div", { ...rest, ref }, children);
    });
    return {
        motion: { div: Div },
        animate: (
            _from: number,
            to: number,
            options: { onUpdate?: (v: number) => void },
        ) => {
            options.onUpdate?.(to);
            return { stop: () => {} };
        },
        useReducedMotion: () => motionPrefs.reduced,
    };
});

describe("goalPercentage", () => {
    it("maps wpm onto 0-100% of the 200 wpm goal", () => {
        expect(goalPercentage(100)).toBe(50);
        expect(goalPercentage(200)).toBe(100);
        expect(goalPercentage(300)).toBe(100);
        expect(goalPercentage(0)).toBe(0);
        expect(goalPercentage(-5)).toBe(0);
        expect(goalPercentage(NaN)).toBe(0);
    });
});

describe("MonkeyTypeStatsCard", () => {
    it("shows only the best score, measured against the 200 wpm goal", () => {
        render(
            <MonkeyTypeStatsCard stats={{ averagewpm: 120, bestwpm: 150 }} />,
        );

        expect(screen.getByText("150")).toBeInTheDocument();
        expect(screen.getByText("wpm best")).toBeInTheDocument();
        // The average is deliberately not shown.
        expect(screen.queryByText("120")).not.toBeInTheDocument();
        expect(screen.getByText("75% of goal")).toBeInTheDocument();
        expect(screen.getByText("200 wpm")).toBeInTheDocument();
        expect(screen.getByRole("progressbar")).toHaveAttribute(
            "aria-valuenow",
            "75",
        );
    });

    it("shows a fallback instead of 'undefined wpm' when stats are unavailable", () => {
        render(<MonkeyTypeStatsCard stats={null} />);

        expect(screen.getAllByText("—")).toHaveLength(1);
        expect(
            screen.getByText("typing stats unavailable"),
        ).toBeInTheDocument();
        expect(screen.getByRole("progressbar")).toHaveAttribute(
            "aria-valuenow",
            "0",
        );
        expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    });

    it("links to the Monkeytype profile", () => {
        render(<MonkeyTypeStatsCard stats={{ averagewpm: 10, bestwpm: 20 }} />);
        const link = screen.getByRole("link", { name: /monkeytype profile/i });
        expect(link).toHaveAttribute(
            "href",
            "https://monkeytype.com/profile/redwiz",
        );
        expect(link).toHaveAttribute(
            "rel",
            expect.stringContaining("noopener"),
        );
    });

    it("renders the same server markup whatever the motion preference", () => {
        // The server can't see prefers-reduced-motion; if the first render
        // depended on it, reduced-motion visitors would get a hydration error.
        const stats = { averagewpm: 120, bestwpm: 151.2 };
        motionPrefs.reduced = false;
        const normal = renderToString(<MonkeyTypeStatsCard stats={stats} />);
        motionPrefs.reduced = true;
        const reduced = renderToString(<MonkeyTypeStatsCard stats={stats} />);
        motionPrefs.reduced = false;
        expect(reduced).toBe(normal);
    });
});
