import React from "react";
import Image from "next/image";

//TODO:
// make sure that these are not optional later
interface ProjectCardProps {
    header?: string;
    imageSrc?: string;
    imageAlt?: string;
    desc?: string;
}

export default function ProjectCard({
    header,
    imageSrc,
    imageAlt,
    desc,
}: ProjectCardProps) {
    return (
        <div className="flex flex-col p-4 col-span-1 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
            {/* <h3>{header}</h3> */}
            <h3>Work in progress...</h3>
            {/* <Image src={imageSrc} alt={imageAlt} width={100} height={100} /> */}
            <p>{desc}</p>
        </div>
    );
}
