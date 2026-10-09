import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    fetchRecentTrack,
    getGithubEvents,
    getMonkeytypeData,
    isNowPlaying,
    parseGithubEvents,
    parseRecentTrack,
    parseTypingScore,
    songLink,
} from "@/lib/api";

function jsonResponse(
    body: unknown,
    init: { ok?: boolean; status?: number } = {},
) {
    const { ok = true, status = 200 } = init;
    return {
        ok,
        status,
        statusText: ok ? "OK" : "Bad Gateway",
        json: async () => body,
    } as unknown as Response;
}

describe("parseTypingScore", () => {
    it("accepts a well-formed payload", () => {
        expect(parseTypingScore({ averagewpm: 120.4, bestwpm: 151 })).toEqual({
            averagewpm: 120.4,
            bestwpm: 151,
        });
    });

    it.each([
        ["error payload", { error: "fask receieved None" }],
        ["nulls", { averagewpm: null, bestwpm: null }],
        ["strings", { averagewpm: "120", bestwpm: "151" }],
        ["NaN", { averagewpm: NaN, bestwpm: 1 }],
        ["array", []],
        ["null", null],
        ["undefined", undefined],
    ])("rejects %s", (_label, payload) => {
        expect(parseTypingScore(payload)).toBeNull();
    });
});

describe("getMonkeytypeData", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
    });
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("returns the parsed stats and asks for hourly revalidation", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue(jsonResponse({ averagewpm: 100, bestwpm: 140 }));
        vi.stubGlobal("fetch", fetchMock);

        await expect(getMonkeytypeData()).resolves.toEqual({
            averagewpm: 100,
            bestwpm: 140,
        });

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toMatch(/\/monkeytype$/);
        expect(init).toMatchObject({ next: { revalidate: 3600 } });
    });

    it("returns null (not NaN-producing zeros) when the backend answers with an error", async () => {
        vi.stubGlobal(
            "fetch",
            vi
                .fn()
                .mockResolvedValue(
                    jsonResponse({ error: "down" }, { ok: false, status: 502 }),
                ),
        );
        await expect(getMonkeytypeData()).resolves.toBeNull();
        expect(console.error).toHaveBeenCalled();
    });

    it("returns null when the payload has the wrong shape", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(jsonResponse({ error: "x" })),
        );
        await expect(getMonkeytypeData()).resolves.toBeNull();
    });

    it("returns null when fetch itself throws", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockRejectedValue(new TypeError("network down")),
        );
        await expect(getMonkeytypeData()).resolves.toBeNull();
    });
});

describe("parseRecentTrack / isNowPlaying", () => {
    it("keeps the fields the card needs", () => {
        expect(
            parseRecentTrack({
                songname: "Song",
                artist: "Artist",
                image: "https://img.example/a.jpg",
                currentlylistening: false,
                url: "https://open.spotify.com/track/abc",
                played_at: "2026-10-08T21:15:04.512Z",
                source: "spotify",
                extra: "ignored",
            }),
        ).toEqual({
            songname: "Song",
            artist: "Artist",
            image: "https://img.example/a.jpg",
            currentlylistening: false,
            url: "https://open.spotify.com/track/abc",
            playedAt: "2026-10-08T21:15:04.512Z",
            source: "spotify",
        });
    });

    it("ignores unknown sources and empty timestamps", () => {
        const track = parseRecentTrack({
            songname: "S",
            artist: "A",
            played_at: "",
            source: "tidal",
        });
        expect(track).not.toHaveProperty("playedAt");
        expect(track).not.toHaveProperty("source");
    });

    it("tolerates missing image and legacy string booleans", () => {
        const track = parseRecentTrack({
            songname: "S",
            artist: "A",
            currentlylistening: "True",
        });
        expect(track).toEqual({
            songname: "S",
            artist: "A",
            image: "",
            currentlylistening: "True",
        });
        expect(isNowPlaying(track!)).toBe(true);
    });

    it("rejects payloads without a song", () => {
        expect(parseRecentTrack({ error: "nope" })).toBeNull();
        expect(parseRecentTrack("string")).toBeNull();
        expect(parseRecentTrack(null)).toBeNull();
    });

    it.each([
        [true, true],
        ["True", true],
        ["true", true],
        [false, false],
        ["False", false],
        ["", false],
    ])("isNowPlaying(%j) -> %s", (value, expected) => {
        expect(isNowPlaying({ currentlylistening: value })).toBe(expected);
    });
});

describe("songLink", () => {
    it("links straight to the track when Spotify supplied it", () => {
        expect(
            songLink({
                songname: "S",
                artist: "A",
                source: "spotify",
                url: "https://open.spotify.com/track/abc",
            }),
        ).toBe("https://open.spotify.com/track/abc");
    });

    it("falls back to a Spotify search for Last.fm data and older backends", () => {
        const expected =
            "https://open.spotify.com/search/Eyes%20Wide%20Shut%20Fineart";
        expect(
            songLink({
                songname: "Eyes Wide Shut",
                artist: "Fineart",
                source: "lastfm",
                url: "https://www.last.fm/music/Fineart/_/Eyes+Wide+Shut",
            }),
        ).toBe(expected);
        expect(
            songLink({ songname: "Eyes Wide Shut", artist: "Fineart" }),
        ).toBe(expected);
    });
});

describe("fetchRecentTrack", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("passes the abort signal through and skips the HTTP cache", async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            jsonResponse({
                songname: "S",
                artist: "A",
                image: "",
                currentlylistening: false,
            }),
        );
        vi.stubGlobal("fetch", fetchMock);
        const controller = new AbortController();

        await expect(
            fetchRecentTrack(controller.signal),
        ).resolves.toMatchObject({ songname: "S" });

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toMatch(/\/nowplaying$/);
        expect(init).toMatchObject({
            signal: controller.signal,
            cache: "no-store",
        });
    });

    it("falls back to /lastfm when the backend predates /nowplaying", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 404 }))
            .mockResolvedValueOnce(
                jsonResponse({ songname: "S", artist: "A" }),
            );
        vi.stubGlobal("fetch", fetchMock);

        await expect(fetchRecentTrack()).resolves.toMatchObject({
            songname: "S",
        });
        expect(fetchMock.mock.calls[1][0]).toMatch(/\/lastfm$/);
    });

    it("does not mask real outages with the fallback", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValue(jsonResponse({}, { ok: false, status: 502 }));
        vi.stubGlobal("fetch", fetchMock);

        await expect(fetchRecentTrack()).rejects.toThrow(/HTTP 502/);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("throws on HTTP errors and malformed payloads", async () => {
        vi.stubGlobal(
            "fetch",
            vi
                .fn()
                .mockResolvedValue(
                    jsonResponse({ error: "x" }, { ok: false, status: 502 }),
                ),
        );
        await expect(fetchRecentTrack()).rejects.toThrow(/HTTP 502/);

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(jsonResponse({ error: "x" })),
        );
        await expect(fetchRecentTrack()).rejects.toThrow(
            /unexpected response shape/,
        );
    });
});

describe("GitHub events", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    const event = {
        message: "m",
        repo_name: "r/x",
        repo_url: "https://github.com/r/x",
        commit_url: "https://github.com/r/x/commit/abc",
        type: "PushEvent",
        created_at: "2026-10-01T12:00:00Z",
    };

    it("drops malformed entries but keeps good ones", () => {
        expect(
            parseGithubEvents({ events: [event, { message: 1 }, null] }),
        ).toEqual({ events: [event] });
        expect(parseGithubEvents({ nope: true })).toBeNull();
    });

    it("getGithubEvents falls back to an empty list on failure", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
        await expect(getGithubEvents()).resolves.toEqual({ events: [] });

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(jsonResponse({ events: [event] })),
        );
        await expect(getGithubEvents()).resolves.toEqual({ events: [event] });
    });
});
