import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RecentlyListenedCard, {
    POLL_INTERVAL_MS,
} from "@/components/RecentlyListenedCard";
import type { RecentTrack } from "@/types";

const fetchRecentTrack = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", async () => {
    const actual =
        await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    return { ...actual, fetchRecentTrack };
});

const TRACK: RecentTrack = {
    songname: "Harder, Better, Faster, Stronger",
    artist: "Daft Punk",
    image: "https://lastfm.freetls.fastly.net/i/u/300x300/cover.jpg",
    currentlylistening: false,
};

function setVisibility(state: DocumentVisibilityState) {
    Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => state,
    });
    document.dispatchEvent(new Event("visibilitychange"));
}

describe("RecentlyListenedCard", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(console, "error").mockImplementation(() => {});
        setVisibility("visible");
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("shows a loading state and then the track", async () => {
        fetchRecentTrack.mockResolvedValue(TRACK);
        render(<RecentlyListenedCard />);

        expect(screen.getByRole("status")).toHaveTextContent(
            "Loading listening history…",
        );

        await act(async () => {});

        expect(screen.getByText("Last played on Spotify")).toBeInTheDocument();
        expect(screen.getByText(TRACK.songname)).toBeInTheDocument();
        expect(screen.getByText("Daft Punk")).toBeInTheDocument();
        expect(screen.getByRole("img")).toHaveAttribute("src", TRACK.image);
        expect(screen.getByRole("img")).toHaveAttribute(
            "alt",
            expect.stringContaining("Daft Punk"),
        );
    });

    it("recognises the legacy 'True' string as now playing", async () => {
        fetchRecentTrack.mockResolvedValue({
            ...TRACK,
            currentlylistening: "True",
        });
        render(<RecentlyListenedCard />);
        await act(async () => {});
        expect(screen.getByText("Now playing on Spotify")).toBeInTheDocument();
    });

    it("links the song straight to the track when Spotify supplied it", async () => {
        fetchRecentTrack.mockResolvedValue({
            ...TRACK,
            source: "spotify",
            url: "https://open.spotify.com/track/5W3cjX2J3tjhG8zb6u0qHn",
        });
        render(<RecentlyListenedCard />);
        await act(async () => {});
        const link = screen.getByRole("link", { name: TRACK.songname });
        expect(link).toHaveAttribute(
            "href",
            "https://open.spotify.com/track/5W3cjX2J3tjhG8zb6u0qHn",
        );
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("links Last.fm data to a Spotify search for the song", async () => {
        fetchRecentTrack.mockResolvedValue({
            ...TRACK,
            source: "lastfm",
            url: "https://www.last.fm/music/Daft+Punk",
        });
        render(<RecentlyListenedCard />);
        await act(async () => {});
        expect(
            screen.getByRole("link", { name: TRACK.songname }),
        ).toHaveAttribute(
            "href",
            "https://open.spotify.com/search/Harder%2C%20Better%2C%20Faster%2C%20Stronger%20Daft%20Punk",
        );
    });

    it("says how long ago a past track was played", async () => {
        vi.setSystemTime(new Date("2026-10-09T12:00:00Z"));
        fetchRecentTrack.mockResolvedValue({
            ...TRACK,
            playedAt: "2026-07-24T02:06:00Z",
        });
        render(<RecentlyListenedCard />);
        await act(async () => {});
        expect(screen.getByText("· 2 months ago")).toBeInTheDocument();
    });

    it("renders a placeholder instead of a broken image when there is no album art", async () => {
        fetchRecentTrack.mockResolvedValue({ ...TRACK, image: "" });
        render(<RecentlyListenedCard />);
        await act(async () => {});
        expect(screen.queryByRole("img")).not.toBeInTheDocument();
        expect(screen.getByText(TRACK.songname)).toBeInTheDocument();
    });

    it("shows an error state instead of loading forever", async () => {
        fetchRecentTrack.mockRejectedValue(new Error("HTTP 502"));
        render(<RecentlyListenedCard />);
        await act(async () => {});
        expect(screen.getByRole("status")).toHaveTextContent(
            "Listening history unavailable.",
        );
    });

    it("keeps the last good track when a later refresh fails", async () => {
        fetchRecentTrack
            .mockResolvedValueOnce(TRACK)
            .mockRejectedValueOnce(new Error("HTTP 502"));
        render(<RecentlyListenedCard />);
        await act(async () => {});
        expect(screen.getByText(TRACK.songname)).toBeInTheDocument();

        await act(async () => {
            vi.advanceTimersByTime(POLL_INTERVAL_MS);
        });

        expect(fetchRecentTrack).toHaveBeenCalledTimes(2);
        expect(screen.getByText(TRACK.songname)).toBeInTheDocument();
    });

    it("polls every 30 seconds while visible, pauses when hidden and refreshes on return", async () => {
        fetchRecentTrack.mockResolvedValue(TRACK);
        const { unmount } = render(<RecentlyListenedCard />);
        await act(async () => {});
        expect(fetchRecentTrack).toHaveBeenCalledTimes(1);

        await act(async () => {
            vi.advanceTimersByTime(POLL_INTERVAL_MS * 2);
        });
        expect(fetchRecentTrack).toHaveBeenCalledTimes(3);

        await act(async () => {
            setVisibility("hidden");
            vi.advanceTimersByTime(POLL_INTERVAL_MS * 3);
        });
        expect(fetchRecentTrack).toHaveBeenCalledTimes(3);

        await act(async () => {
            setVisibility("visible");
        });
        expect(fetchRecentTrack).toHaveBeenCalledTimes(4);

        unmount();
        await act(async () => {
            vi.advanceTimersByTime(POLL_INTERVAL_MS * 3);
        });
        expect(fetchRecentTrack).toHaveBeenCalledTimes(4);
    });

    it("aborts the in-flight request when unmounting", async () => {
        let receivedSignal: AbortSignal | undefined;
        fetchRecentTrack.mockImplementation(
            (signal: AbortSignal) =>
                new Promise(() => {
                    receivedSignal = signal;
                }),
        );
        const { unmount } = render(<RecentlyListenedCard />);
        expect(receivedSignal?.aborted).toBe(false);
        unmount();
        expect(receivedSignal?.aborted).toBe(true);
    });
});
