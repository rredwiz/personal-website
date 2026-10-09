import type { Metadata } from "next";
import Avatar from "@/components/Avatar";
import ProjectCard from "@/components/ProjectCard";
import { Card, CardFileBar } from "@/components/ui/Card";
import ExternalLink from "@/components/ui/ExternalLink";
import { BookOpenIcon } from "@/components/icons";
// GitHub activity feed: backend route + component are ready, just not shown yet.
// import GithubEvents from "@/components/GithubEvents";
// import { getGithubEvents } from "@/lib/api";

export const metadata: Metadata = {
    title: "projects | andrew's website",
    description: "Personal projects and things I've built.",
};

const PROJECTS = [
    {
        header: "MC Instance Bot", // keep headers short so they fit the card
        desc: "Enabled a Discord bot to create and manage Minecraft instances.",
        url: "https://github.com/rredwiz/alt-manager",
        tags: ["Node.js", "discord.js", "Mineflayer"],
    },
    {
        header: "Syllabuddy AI",
        desc: "Implemented a syllabus decoder to parse important details.",
        url: "https://github.com/qZheng/syllabus-decoder",
        tags: ["Next.js", "Flask", "OpenAI"],
    },
    {
        header: "Desktop Timer App",
        desc: "An Electron desktop timer app made for myself and friends.",
        url: "https://github.com/rredwiz/timer-app",
        tags: ["Electron", "TypeScript"],
    },
] as const;

export default function ProjectsPage() {
    // const githubEvents = await getGithubEvents();

    return (
        <main
            id="content"
            className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6"
        >
            <div className="rise-in grid w-full max-w-4xl gap-4 md:grid-cols-3">
                <Card as="section" className="md:col-span-3">
                    <CardFileBar icon={<BookOpenIcon className="size-3.5" />}>
                        <ExternalLink
                            href="https://github.com/rredwiz"
                            className="transition-colors hover:text-ink"
                        >
                            projects<span className="text-ink-faint/60">/</span>
                            <span className="text-ink-soft">README</span>.md
                        </ExternalLink>
                    </CardFileBar>
                    <div className="flex items-center gap-4 sm:gap-6">
                        <Avatar scale={4} preload />
                        <div className="min-w-0">
                            <h1 className="font-display text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
                                Personal projects{" "}
                                <span className="text-ink-muted">
                                    and things I&apos;ve built
                                </span>
                            </h1>
                            <p className="mt-2 text-ink-muted">
                                They can each be found on my own github{" "}
                                <ExternalLink
                                    inline
                                    href="https://github.com/rredwiz"
                                >
                                    here
                                </ExternalLink>
                                —more to come in the future.
                            </p>
                        </div>
                    </div>
                </Card>
                {/* <GithubEvents events={githubEvents.events} /> */}
                {PROJECTS.map((project) => (
                    <ProjectCard key={project.url} {...project} />
                ))}
            </div>
        </main>
    );
}
