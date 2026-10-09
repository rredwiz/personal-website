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
    /** Link to the track on Last.fm (not sent by older backend builds). */
    url?: string;
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
