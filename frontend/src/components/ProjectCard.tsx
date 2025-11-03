"use client";
import React from "react";
import Image from "next/image";

// eh i mean tbh its fine if they are optional
interface ProjectCardProps {
    header?: string;
    url: string;
    imageSrc?: string;
    imageAlt?: string;
    desc?: string;
}

export default function ProjectCard({
    header,
    url,
    imageSrc,
    imageAlt,
    desc,
}: ProjectCardProps) {
    return (
        <div className="flex flex-col relative p-4 col-span-1 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
            <div className="flex justify-center absolute top-0 right-0 p-2">
                <Image
                    src="/external.svg"
                    onClick={() => window.open(url, "_blank")}
                    width={16}
                    height={16}
                    className="cursor-pointer"
                    alt="external link icon"
                />
            </div>
            <h3>{header ?? "Work in progress..."}</h3>
            <p className="text-gray-400 text-sm">
                {desc ?? "Sample description..."}
            </p>
        </div>
    );
}
