import React from "react";
import Image from "next/image";
import ProjectCard from "@/components/ProjectCard";

export default function ProjectsPage() {
    return (
        <main>
            <div
                className="flex justify-center items-center min-h-screen min-w-screen"
            >
                <div className="flex relative m-8 mt-20 md:mt-0 flex-col md:grid md:grid-cols-3 gap-4 w-3xl">
                    <div className="flex p-4 col-span-3 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
                        <div className="flex justify-center items-center gap-4">
                            <div className="flex flex-col gap-2">
                                <p className="text-xs text-white font-mono">
                                    <a
                                        href="https://github.com/rredwiz"
                                        target="_blank"
                                    >
                                        projects
                                        <span className="text-gray-400">/</span>
                                        README
                                        <span className="text-gray-400">
                                            .md
                                        </span>
                                    </a>
                                </p>
                                <Image
                                    src="/ImageIcon.png"
                                    className="h-auto w-auto mb-2 rounded-full md:w-20"
                                    width={153}
                                    height={153}
                                    alt="minecraft character image"
                                />
                            </div>
                            <div>
                                <h1 className="font-semibold text-lg md:text-2xl">
                                    Personal projects{" "}
                                    <span className="hidden md:inline">
                                        and things I've built
                                    </span>
                                </h1>
                                <p className="text-gray-400 md:text-md">
                                    They can each be found on my own github{" "}
                                    <a
                                        className="hover:text-white text-gray-300 border-b"
                                        href="https://github.com/rredwiz"
                                        target="_blank"
                                    >
                                        here
                                    </a>
                                    —more to come in the future.
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* <ProjectCard
                        header="Desktop Timer App"
                        imageSrc="/timer-app-example2.png"
                        imageAlt="timer app example image"
                        desc="..."
                    />
                    <ProjectCard
                        header="Desktop Timer App"
                        imageSrc="/timer-app-example2.png"
                        imageAlt="timer app example image"
                        desc="..."
                    />
                    <ProjectCard
                        header="Desktop Timer App"
                        imageSrc="/timer-app-example2.png"
                        imageAlt="timer app example image"
                        desc="..."
                    /> */}
                    <ProjectCard />
                    <ProjectCard />
                    <ProjectCard />
                </div>
            </div>
        </main>
    );
}
