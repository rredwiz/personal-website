"use client";
import { useCallback, useState } from "react";
import { usePolling } from "@/hooks/usePolling";
import { backendUrl } from "@/lib/config";

// Not rendered yet: the backend's /spotify route is disabled until the
// integration is ready. Kept in sync with the polling/abort behaviour of
// RecentlyListenedCard so it can be dropped in later.
const POLL_INTERVAL_MS = 20_000;
const CARD_CLASS = "p-4 col-span-2 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25";

export default function SpotifyCard() {
    const [spotifyIframeUrl, setSpotifyIframeUrl] = useState<string | null>(null);

    const refresh = useCallback(async (signal: AbortSignal) => {
        try {
            const response = await fetch(backendUrl("/spotify"), { signal, cache: "no-store" });
            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
            }
            const data: unknown = await response.json();
            if (signal.aborted) return;
            setSpotifyIframeUrl(typeof data === "string" && data.startsWith("https://open.spotify.com/") ? data : null);
        } catch (error) {
            if (signal.aborted) return;
            console.error("Could not load the Spotify player:", error);
        }
    }, []);

    usePolling(refresh, POLL_INTERVAL_MS);

    if (!spotifyIframeUrl) {
        return (
            <div className={CARD_CLASS}>
                <p className="text-gray-400 h-25">Nothing currently playing.</p>
            </div>
        );
    }

    return (
        <div className={CARD_CLASS}>
            <div className="overflow-hidden rounded-xl">
                <iframe
                    src={spotifyIframeUrl}
                    title="Spotify player"
                    width="100%"
                    height="151"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="block w-full border-0"
                />
            </div>
        </div>
    );
}
