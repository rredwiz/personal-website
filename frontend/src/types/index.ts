export type TypingScore = {
    averagewpm: number;
    bestwpm: number;
};

export type GithubCommitEvents = {
    events: {
        message: string;
        repo_name: string;
        repo_url: string;
        commit_url: string;
        type: string;
        created_at: string;
    }[];
};
