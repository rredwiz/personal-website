import { GithubCommitEvents } from "@/types";
import React from "react";

export default function GithubEvents({ events }: GithubCommitEvents) {
    return (
        <div className="flex flex-col p-4 col-span-3 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
            <h3 className="text-lg font-bold">Recent Github Events</h3>
            {events.map((event, index) => (
                <div key={index} className="flex flex-col gap-2">
                    <div className="flex justify-between">
                        <p className="text-gray-400">{event.repo_name}</p>
                        <p className="text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap w-1/2">{event.message}</p>
                        <p className="text-gray-400">{event.created_at}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}