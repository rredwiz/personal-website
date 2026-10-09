"use client";
import { useCallback, useState } from "react";
import { usePolling } from "@/hooks/usePolling";
import { fetchRecentTrack, isNowPlaying } from "@/lib/api";
import type { RecentTrack } from "@/types";

/** How often to ask the backend for the current track while the tab is visible. */
export const POLL_INTERVAL_MS = 30_000;

type Status = "loading" | "ready" | "error";

const CARD_CLASS = "p-4 col-span-2 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25";

export default function RecentlyListenedCard() {
    const [track, setTrack] = useState<RecentTrack | null>(null);
    const [status, setStatus] = useState<Status>("loading");

    const refresh = useCallback(async (signal: AbortSignal) => {
        try {
            const next = await fetchRecentTrack(signal);
            if (signal.aborted) return;
            setTrack(next);
            setStatus("ready");
        } catch (error) {
            if (signal.aborted) return;
            console.error("Could not load listening history:", error);
            // Keep showing the last good track if we had one; only show the
            // error state when there is nothing better to show.
            setStatus((current) => (current === "ready" ? current : "error"));
        }
    }, []);

    usePolling(refresh, POLL_INTERVAL_MS);

    if (!track) {
        return (
            <div className={CARD_CLASS}>
                <p className="text-gray-400 h-25" role="status">
                    {status === "error" ? "Listening history unavailable." : "Loading Listening History..."}
                </p>
            </div>
        );
    }

    const nowPlaying = isNowPlaying(track);

    return (
        <div className={CARD_CLASS}>
            <div className="flex gap-4">
                {track.image ? (
                    // Plain <img>: Last.fm's CDN host can change, and next/image
                    // throws at runtime for hosts missing from next.config.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={track.image}
                        className="opacity-90 w-25 rounded-md"
                        width={100}
                        height={100}
                        alt={`Album art for ${track.songname} by ${track.artist}`}
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <div className="w-25 h-25 shrink-0 rounded-md bg-white/5" aria-hidden="true" />
                )}
                <div className="flex w-[100%] min-h-25 justify-center flex-col">
                    <h2 className="text-sm">
                        {nowPlaying ? "Currently listening on Spotify" : "Recently Listened to on Spotify"}
                    </h2>
                    <p className="text-lg">{track.songname}</p>
                    <p className="text-gray-400">{track.artist}</p>
                </div>
            </div>
        </div>
    );
}
