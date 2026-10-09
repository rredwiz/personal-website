"use client";
import { useCallback, useState } from "react";
import { usePolling } from "@/hooks/usePolling";
import { fetchRecentTrack, isNowPlaying } from "@/lib/api";
import { cx } from "@/lib/cx";
import type { RecentTrack } from "@/types";
import { Card, CardLabel } from "@/components/ui/Card";
import ExternalLink from "@/components/ui/ExternalLink";
import { SpotifyIcon } from "@/components/icons";

/** How often to ask the backend for the current track while the tab is visible. */
export const POLL_INTERVAL_MS = 30_000;

type Status = "loading" | "ready" | "error";

const CARD_CLASS = "flex items-center gap-4 sm:gap-5";
/** Fixed size so the row never jumps when the artwork arrives. */
const ART_CLASS = "size-20 shrink-0 rounded-lg sm:size-24 md:size-32";

/** Three bouncing bars; static (and still meaningful) with reduced motion. */
function Equalizer() {
    return (
        <span aria-hidden="true" className="flex h-3 items-end gap-[2px]">
            {[0, 0.25, 0.5].map((delay) => (
                <span
                    key={delay}
                    className="h-full w-[3px] origin-bottom animate-equalize rounded-full bg-ink-soft"
                    style={{ animationDelay: `-${delay}s` }}
                />
            ))}
        </span>
    );
}

export default function RecentlyListenedCard({
    className,
}: {
    className?: string;
}) {
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

    if (!track && status === "error") {
        return (
            <Card className={cx(CARD_CLASS, className)}>
                <div
                    className={cx(
                        ART_CLASS,
                        "flex items-center justify-center bg-white/[0.04]",
                    )}
                    aria-hidden="true"
                >
                    <SpotifyIcon className="size-7 text-ink-faint/50" />
                </div>
                <div className="min-w-0">
                    <CardLabel>last.fm</CardLabel>
                    <p role="status" className="mt-2 text-ink-muted">
                        Listening history unavailable.
                    </p>
                </div>
            </Card>
        );
    }

    if (!track) {
        return (
            <Card className={cx(CARD_CLASS, className)}>
                <div
                    className={cx(ART_CLASS, "animate-pulse bg-white/[0.06]")}
                    aria-hidden="true"
                />
                <div className="flex-1 space-y-2.5" aria-hidden="true">
                    <div className="h-3 w-36 animate-pulse rounded bg-white/[0.06]" />
                    <div className="h-5 w-52 max-w-full animate-pulse rounded bg-white/[0.08]" />
                    <div className="h-4 w-28 animate-pulse rounded bg-white/[0.06]" />
                </div>
                <p role="status" className="sr-only">
                    Loading listening history…
                </p>
            </Card>
        );
    }

    const nowPlaying = isNowPlaying(track);

    return (
        <Card className={cx(CARD_CLASS, className)}>
            {track.image ? (
                // Plain <img>: Last.fm's CDN host can change, and next/image
                // throws at runtime for hosts missing from next.config.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={track.image}
                    className={cx(
                        ART_CLASS,
                        "object-cover shadow-lg ring-1 ring-white/10",
                    )}
                    width={96}
                    height={96}
                    alt={`Album art for ${track.songname} by ${track.artist}`}
                    loading="lazy"
                    decoding="async"
                />
            ) : (
                <div
                    className={cx(ART_CLASS, "bg-white/[0.04]")}
                    aria-hidden="true"
                />
            )}
            <div className="min-w-0 flex-1">
                <CardLabel className={cx(nowPlaying && "text-ink-soft")}>
                    {nowPlaying ? (
                        <Equalizer />
                    ) : (
                        <span
                            aria-hidden="true"
                            className="size-1.5 rounded-full bg-ink-faint"
                        />
                    )}
                    {nowPlaying
                        ? "Now playing on Spotify"
                        : "Last played on Spotify"}
                </CardLabel>
                <p className="mt-2 line-clamp-2 font-display text-xl leading-tight font-semibold tracking-tight md:text-2xl">
                    {track.url ? (
                        <ExternalLink
                            href={track.url}
                            className="transition-colors duration-200 hover:text-accent"
                        >
                            {track.songname}
                        </ExternalLink>
                    ) : (
                        track.songname
                    )}
                </p>
                <p className="mt-1 truncate text-ink-muted">{track.artist}</p>
            </div>
            <SpotifyIcon className="hidden size-5 shrink-0 self-start text-ink-faint/60 sm:block" />
        </Card>
    );
}
