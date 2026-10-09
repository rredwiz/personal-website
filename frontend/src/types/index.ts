export type TypingScore = {
    averagewpm: number;
    bestwpm: number;
};

export type RecentTrack = {
    artist: string;
    songname: string;
    /** Album art URL; empty string when Last.fm has none. */
    image: string;
    /**
     * `true` when the track is playing right now. Older backend builds sent the
     * Python string `"True"`, so both shapes are accepted (see `isNowPlaying`).
     */
    currentlylistening: boolean | string;
    /**
     * Link to the track: on Spotify when `source` is "spotify", on Last.fm when
     * it is "lastfm" (older backend builds send neither). See `songLink`.
     */
    url?: string;
    /** ISO 8601 time it was played; absent while it's playing or from older backends. */
    playedAt?: string;
    /** Which service the backend got it from (absent from older backends). */
    source?: "spotify" | "lastfm";
};

export type GithubCommitEvent = {
    message: string;
    repo_name: string;
    repo_url: string;
    commit_url: string;
    type: string;
    created_at: string;
};

export type GithubCommitEvents = {
    events: GithubCommitEvent[];
};
