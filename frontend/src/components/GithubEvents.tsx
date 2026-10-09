import type { GithubCommitEvents } from "@/types";

/** "2026-10-01T12:00:00Z" -> "Oct 1, 2026"; falls back to the raw string for anything unparseable. */
export function formatEventDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString("en-CA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
}

export default function GithubEvents({ events }: GithubCommitEvents) {
    return (
        <div className="flex flex-col p-4 col-span-3 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
            <h2 className="text-lg font-bold">Recent Github Events</h2>
            {events.length === 0 && (
                <p className="text-gray-400">No recent public activity.</p>
            )}
            {events.map((event) => (
                <div
                    key={`${event.commit_url}-${event.created_at}`}
                    className="flex flex-col gap-2"
                >
                    <div className="flex justify-between gap-4">
                        <a
                            href={event.repo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            {event.repo_name}
                        </a>
                        <a
                            href={event.commit_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-white transition-colors overflow-hidden text-ellipsis whitespace-nowrap w-1/2"
                            title={event.message}
                        >
                            {event.message}
                        </a>
                        <time
                            className="text-gray-400"
                            dateTime={event.created_at}
                        >
                            {formatEventDate(event.created_at)}
                        </time>
                    </div>
                </div>
            ))}
        </div>
    );
}
