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

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
    const response = await fetch(backendUrl(path), init);
    if (!response.ok) {
        throw new Error(
            `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`,
        );
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
// Last.fm
// ---------------------------------------------------------------------------

export function parseRecentTrack(data: unknown): RecentTrack | null {
    if (!isRecord(data)) return null;
    const { songname, artist, image, currentlylistening, url } = data;
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
    };
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

/** Client-side fetch of the most recent track. Throws on failure so the caller can decide what to show. */
export async function fetchRecentTrack(
    signal?: AbortSignal,
): Promise<RecentTrack> {
    const data = await requestJson("/lastfm", { signal, cache: "no-store" });
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
