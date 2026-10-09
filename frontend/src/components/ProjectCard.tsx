import Image from "next/image";

interface ProjectCardProps {
    header?: string;
    url: string;
    imageSrc?: string;
    imageAlt?: string;
    desc?: string;
}

export default function ProjectCard({ header, url, imageSrc, imageAlt, desc }: ProjectCardProps) {
    const title = header ?? "Work in progress...";

    return (
        <div className="flex flex-col relative p-4 col-span-1 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
            {/* A real link (not an onClick on an image) so it works with the keyboard, middle-click and screen readers. */}
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${title} in a new tab`}
                className="flex justify-center absolute top-0 right-0 p-2 rounded-xl"
            >
                <Image src="/external.svg" width={16} height={16} alt="" />
            </a>
            {imageSrc && (
                <Image
                    src={imageSrc}
                    width={400}
                    height={225}
                    className="w-full h-auto rounded-md mb-2"
                    alt={imageAlt ?? ""}
                />
            )}
            <h3>{title}</h3>
            <p className="text-gray-400 text-sm">{desc ?? "Sample description..."}</p>
        </div>
    );
}
