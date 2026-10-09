import type { GithubCommitEvents, RecentTrack, TypingScore } from "@/types";
import { backendUrl } from "./config";

/** How long the server-rendered Monkeytype numbers may be reused (ISR), in seconds. */
export const MONKEYTYPE_REVALIDATE_SECONDS = 3600;

function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A non-2xx answer from the backend; `status` lets callers react to specific codes. */
export class HttpError extends Error {
    constructor(
        readonly status: number,
        statusText = "",
    ) {
        super(`HTTP ${status}${statusText ? ` ${statusText}` : ""}`);
        this.name = "HttpError";
    }
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
    const response = await fetch(backendUrl(path), init);
    if (!response.ok) {
        throw new HttpError(response.status, response.statusText);
    }
    return response.json();
}

// ---------------------------------------------------------------------------
// Monkeytype
// ---------------------------------------------------------------------------

/** Validate a `/monkeytype` payload; anything malformed becomes `null` instead of `NaN` in the UI. */
export function parseTypingScore(data: unknown): TypingScore | null {
    if (!isRecord(data)) return null;
    const { averagewpm, bestwpm } = data;
    if (!isFiniteNumber(averagewpm) || !isFiniteNumber(bestwpm)) return null;
    return { averagewpm, bestwpm };
}

/** Server-side fetch of the typing stats, cached for an hour. Returns `null` when unavailable. */
export async function getMonkeytypeData(): Promise<TypingScore | null> {
    try {
        const data = await requestJson("/monkeytype", {
            next: { revalidate: MONKEYTYPE_REVALIDATE_SECONDS },
        });
        const parsed = parseTypingScore(data);
        if (!parsed) throw new Error("unexpected response shape");
        return parsed;
    } catch (error) {
        console.error("Could not load Monkeytype stats:", error);
        return null;
    }
}

// ---------------------------------------------------------------------------
// Now playing (Spotify, or Last.fm as the fallback)
// ---------------------------------------------------------------------------

export function parseRecentTrack(data: unknown): RecentTrack | null {
    if (!isRecord(data)) return null;
    const {
        songname,
        artist,
        image,
        currentlylistening,
        url,
        played_at,
        source,
    } = data;
    if (typeof songname !== "string" || typeof artist !== "string") return null;
    return {
        songname,
        artist,
        image: typeof image === "string" ? image : "",
        currentlylistening:
            typeof currentlylistening === "boolean" ||
            typeof currentlylistening === "string"
                ? currentlylistening
                : false,
        ...(typeof url === "string" && url ? { url } : {}),
        ...(typeof played_at === "string" && played_at
            ? { playedAt: played_at }
            : {}),
        ...(source === "spotify" || source === "lastfm" ? { source } : {}),
    };
}

/**
 * Where the song should link: the track itself when the data came from
 * Spotify, otherwise a Spotify search for it (Last.fm only knows the names).
 */
export function songLink(
    track: Pick<RecentTrack, "songname" | "artist" | "url" | "source">,
): string {
    if (track.source === "spotify" && track.url) return track.url;
    const query = `${track.songname} ${track.artist}`.trim();
    return `https://open.spotify.com/search/${encodeURIComponent(query)}`;
}

/** True when the track is playing right now (accepts the legacy `"True"` string). */
export function isNowPlaying(
    track: Pick<RecentTrack, "currentlylistening">,
): boolean {
    const value = track.currentlylistening;
    return (
        value === true ||
        (typeof value === "string" && value.toLowerCase() === "true")
    );
}

/** Client-side fetch of the current / most recent track. Throws on failure so the caller can decide what to show. */
export async function fetchRecentTrack(
    signal?: AbortSignal,
): Promise<RecentTrack> {
    const init: RequestInit = { signal, cache: "no-store" };
    let data: unknown;
    try {
        data = await requestJson("/nowplaying", init);
    } catch (error) {
        // Backends deployed before /nowplaying existed only have /lastfm.
        if (!(error instanceof HttpError && error.status === 404)) throw error;
        data = await requestJson("/lastfm", init);
    }
    const parsed = parseRecentTrack(data);
    if (!parsed) throw new Error("unexpected response shape");
    return parsed;
}

// ---------------------------------------------------------------------------
// GitHub (component not rendered yet; see projects/page.tsx)
// ---------------------------------------------------------------------------

export function parseGithubEvents(data: unknown): GithubCommitEvents | null {
    if (!isRecord(data) || !Array.isArray(data.events)) return null;
    const events = data.events.filter(
        (event): event is GithubCommitEvents["events"][number] =>
            isRecord(event) &&
            typeof event.message === "string" &&
            typeof event.repo_name === "string" &&
            typeof event.repo_url === "string" &&
            typeof event.commit_url === "string" &&
            typeof event.type === "string" &&
            typeof event.created_at === "string",
    );
    return { events };
}

export async function getGithubEvents(): Promise<GithubCommitEvents> {
    try {
        const parsed = parseGithubEvents(
            await requestJson("/github", { next: { revalidate: 300 } }),
        );
        if (!parsed) throw new Error("unexpected response shape");
        return parsed;
    } catch (error) {
        console.error("Could not load GitHub events:", error);
        return { events: [] };
    }
}
