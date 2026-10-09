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

    it("links the song to Last.fm when the backend sends a URL", async () => {
        fetchRecentTrack.mockResolvedValue({
            ...TRACK,
            url: "https://www.last.fm/music/Daft+Punk/_/Harder,+Better,+Faster,+Stronger",
        });
        render(<RecentlyListenedCard />);
        await act(async () => {});
        const link = screen.getByRole("link", { name: TRACK.songname });
        expect(link).toHaveAttribute(
            "href",
            "https://www.last.fm/music/Daft+Punk/_/Harder,+Better,+Faster,+Stronger",
        );
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("shows the song as plain text without a URL", async () => {
        fetchRecentTrack.mockResolvedValue(TRACK);
        render(<RecentlyListenedCard />);
        await act(async () => {});
        expect(screen.getByText(TRACK.songname)).toBeInTheDocument();
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
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
