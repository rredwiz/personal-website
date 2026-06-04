"use client";
import { useEffect, useState } from "react";

export default function SpotifyCard() {
    const [spotifyIframeUrl, setSpotifyIframeUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchCurrentlyListening = async () => {
            try {
                const response = await fetch(
                    "http://127.0.0.1:8000/spotify"
                );
                if (!response.ok) {
                    throw new Error(
                        `HTTP Error ${response.status}: ${response.statusText}`
                    );
                }
                const data = await response.json();
                setSpotifyIframeUrl(data);
            } catch (e) {
                console.error(`Error occured during a fetch:`, e);
            }
        };

        fetchCurrentlyListening();
        const intervalId = setInterval(fetchCurrentlyListening, 20000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    if (!spotifyIframeUrl) {
        return (
            <div className="p-4 col-span-2 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
                <p className="text-gray-400 h-25">Nothing currently playing.</p>
            </div>
        );
    }

    return (
        <div className="p-4 col-span-2 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
            <div className="overflow-hidden rounded-xl">
                <iframe
                    src={spotifyIframeUrl}
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
