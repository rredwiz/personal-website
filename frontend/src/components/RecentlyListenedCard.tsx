"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

type trackJSON = {
    artist: string;
    currentlylistening: string;
    image: string;
    songname: string;
};

export default function RecentlyListenedCard() {
    const [track, setTrack] = useState<trackJSON | null>(null);

    useEffect(() => {
        const fetchRecentlyListened = async () => {
            try {
                const response = await fetch("http://localhost:5000/lastfm");
                if (!response.ok) {
                    throw new Error(
                        `HTTP Error ${response.status}: ${response.statusText}`
                    );
                }
                const data = await response.json();
                setTrack(data);
            } catch (e) {
                console.error(`Error occured during a fetch:`, e);
            }
        };

        fetchRecentlyListened();
        const intervalId = setInterval(fetchRecentlyListened, 4000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    if (!track) {
        return (
            <div className="p-4 col-span-2 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
                <h3 className="text-2xl">Loading...</h3>
                <p className="text-gray-400">Loading Listening History...</p>
            </div>
        );
    }

    return (
        <div className="p-4 col-span-2 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
            <div className="flex gap-4">
                <Image
                    className="mt-1 opacity-90 w-25 rounded-md"
                    src={track.image}
                    height={100}
                    width={100}
                    alt="current song album image"
                />
                <div className="flex w-[100%] justify-center flex-col">
                    <h3 className="text-sm">
                        {track.currentlylistening === "True"
                            ? "Currently listening on Spotify"
                            : "Recently Listened to on Spotify"}
                    </h3>
                    <h5 className="text-lg">{track.songname}</h5>
                    <p className="text-gray-400">{track.artist}</p>
                </div>
            </div>
        </div>
    );
}
