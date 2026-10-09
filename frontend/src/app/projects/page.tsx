import type { Metadata } from "next";
import Image from "next/image";
import ProjectCard from "@/components/ProjectCard";
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
        url: "https://github.com/rredwiz/alt_manager",
    },
    {
        header: "Syllabuddy AI",
        desc: "Implemented a syllabus decoder to parse important details.",
        url: "https://github.com/qZheng/syllabus-decoder",
    },
    {
        header: "Desktop Timer App",
        desc: "An Electron desktop timer app made for myself and friends.",
        url: "https://github.com/rredwiz/timer-app",
    },
] as const;

export default function ProjectsPage() {
    // const githubEvents = await getGithubEvents();

    return (
        <main>
            <div className="flex justify-center items-center min-h-screen min-w-screen">
                <div className="flex relative m-8 mt-20 mb-20 md:mt-0 md:mb-8 flex-col md:grid md:grid-cols-3 gap-4 w-3xl">
                    <div className="flex p-4 col-span-3 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
                        <div className="flex justify-center items-center gap-4">
                            <div className="flex flex-col gap-2">
                                <p className="text-xs text-white font-mono">
                                    <a href="https://github.com/rredwiz" target="_blank" rel="noopener noreferrer">
                                        projects
                                        <span className="text-gray-400">/</span>
                                        README
                                        <span className="text-gray-400">.md</span>
                                    </a>
                                </p>
                                <Image
                                    src="/pixierou.png"
                                    className="h-auto w-auto mb-2 md:w-20"
                                    width={153}
                                    height={153}
                                    alt="Andrew's Minecraft character"
                                    priority
                                />
                            </div>
                            <div>
                                <h1 className="font-semibold text-lg md:text-2xl">
                                    Personal projects <span className="hidden md:inline">and things I&apos;ve built</span>
                                </h1>
                                <p className="text-gray-400">
                                    They can each be found on my own github{" "}
                                    <a
                                        className="text-gray-300 border-b border-gray-300/70 transition-colors duration-200 ease-in-out hover:text-white hover:border-white"
                                        href="https://github.com/rredwiz"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        here
                                    </a>
                                    —more to come in the future.
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* <GithubEvents events={githubEvents.events} /> */}
                    {PROJECTS.map((project) => (
                        <ProjectCard key={project.url} {...project} />
                    ))}
                </div>
            </div>
        </main>
    );
}
