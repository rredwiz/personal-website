import Image from "next/image";
import { Card } from "@/components/ui/Card";
import ExternalLink from "@/components/ui/ExternalLink";
import { ArrowUpRightIcon } from "@/components/icons";

interface ProjectCardProps {
    header?: string;
    url: string;
    imageSrc?: string;
    imageAlt?: string;
    desc?: string;
    /** Stack/tooling chips shown along the bottom of the card. */
    tags?: readonly string[];
}

/** "https://github.com/rredwiz/timer-app" -> "rredwiz/timer-app"; other URLs -> their host. */
export function repoLabel(url: string): string {
    try {
        const { hostname, pathname } = new URL(url);
        const path = pathname.replace(/^\/+|\/+$/g, "");
        return hostname === "github.com" && path ? path : hostname;
    } catch {
        return url;
    }
}

export default function ProjectCard({
    header,
    url,
    imageSrc,
    imageAlt,
    desc,
    tags,
}: ProjectCardProps) {
    const title = header ?? "Work in progress...";

    return (
        <Card
            as="article"
            className="group flex flex-col transition duration-300 hover:-translate-y-0.5 hover:border-line-strong has-[a:focus-visible]:border-line-strong"
        >
            {imageSrc && (
                <Image
                    src={imageSrc}
                    width={400}
                    height={225}
                    className="mb-4 h-auto w-full rounded-lg border border-line"
                    alt={imageAlt ?? ""}
                />
            )}
            <div className="flex items-center justify-between gap-3">
                <p className="truncate font-mono text-xs text-ink-faint">
                    {repoLabel(url)}
                </p>
                <ArrowUpRightIcon className="size-4 shrink-0 text-ink-faint transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
            </div>
            <h3 className="mt-3 font-display text-lg leading-snug font-semibold tracking-tight">
                {/*
                 * The link's ::after covers the whole card, so the card is one
                 * big click target that is still a single, real link.
                 */}
                <ExternalLink
                    href={url}
                    aria-label={`Open ${title} in a new tab`}
                    className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
                >
                    {title}
                </ExternalLink>
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {desc ?? "Sample description..."}
            </p>
            {tags && tags.length > 0 && (
                <ul
                    aria-label="Built with"
                    className="mt-auto flex flex-wrap gap-1.5 pt-4"
                >
                    {tags.map((tag) => (
                        <li
                            key={tag}
                            className="rounded-md border border-line bg-white/[0.03] px-2 py-0.5 font-mono text-[11px] text-ink-muted"
                        >
                            {tag}
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}
