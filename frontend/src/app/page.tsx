import type { ComponentType, SVGProps } from "react";
import Avatar from "@/components/Avatar";
import RecentlyListenedCard from "@/components/RecentlyListenedCard";
import MonkeyTypeStatsCard from "@/components/MonkeyTypeStatsCard";
import { Card, CardFileBar } from "@/components/ui/Card";
import ExternalLink from "@/components/ui/ExternalLink";
import { Buffer, Cursor } from "@/components/vim/Buffer";
import {
    BookOpenIcon,
    FileTextIcon,
    GitHubIcon,
    LinkedInIcon,
    MapPinIcon,
} from "@/components/icons";
import { getMonkeytypeData } from "@/lib/api";
import { cx } from "@/lib/cx";

const SOCIAL_LINKS: ReadonlyArray<{
    href: string;
    label: string;
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
    { href: "https://github.com/rredwiz", label: "GitHub", Icon: GitHubIcon },
    {
        href: "https://www.linkedin.com/in/andrew-dutka-65368135a/",
        label: "LinkedIn",
        Icon: LinkedInIcon,
    },
    {
        href: "/Andrew-Dutka-Resume.pdf",
        label: "Resume (PDF)",
        Icon: FileTextIcon,
    },
];

function ProfileCard() {
    return (
        <Card className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
                <Avatar scale={5} preload className="-mt-1 -ml-1" />
                <ul className="flex gap-1.5">
                    {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                        <li key={href}>
                            <ExternalLink
                                href={href}
                                aria-label={`${label} (opens in a new tab)`}
                                title={label}
                                className="flex size-9 items-center justify-center rounded-lg border border-line bg-white/[0.03] text-ink-muted transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:bg-white/[0.07] hover:text-ink"
                            >
                                <Icon className="size-[18px]" />
                            </ExternalLink>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h1 className="font-display text-2xl leading-[1.2] font-bold tracking-tight">
                    <span className="text-ink-soft">Hey, I&apos;m</span>{" "}
                    {/* nowrap keeps the cursor on the name's line */}
                    <span className="whitespace-nowrap">
                        <span className="text-white">Andrew</span>
                        <span className="text-ink-soft">.</span>
                        <Cursor />
                    </span>
                </h1>
                <p className="mt-1.5 text-ink-muted">
                    CS Student &amp; Developer
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-faint">
                    <MapPinIcon className="size-4" />
                    Nova Scotia, Canada
                </p>
            </div>
        </Card>
    );
}

function AboutCard({ className }: { className?: string }) {
    return (
        <Card
            as="section"
            aria-labelledby="about-heading"
            className={cx("flex flex-col", className)}
        >
            <CardFileBar
                icon={<BookOpenIcon className="size-3.5" />}
                meta="markdown"
            >
                <ExternalLink
                    href="https://github.com/rredwiz"
                    className="transition-colors hover:text-ink"
                >
                    andrew<span className="text-ink-faint/60">/</span>
                    <span className="text-ink-soft">README</span>.md
                </ExternalLink>
            </CardFileBar>
            <Buffer
                lines={[
                    <h2
                        key="heading"
                        id="about-heading"
                        className="font-display text-xl font-bold tracking-tight"
                    >
                        <span aria-hidden="true" className="text-ink-faint">
                            #{" "}
                        </span>
                        About Me
                    </h2>,
                    null,
                    <p
                        key="body"
                        className="text-[0.95rem] leading-relaxed text-ink-soft"
                    >
                        I&apos;m a currently-enrolled rising junior Computer
                        Science student and software developer. At the moment,
                        I&apos;m interning at{" "}
                        <ExternalLink
                            inline
                            href="https://www.purolator.com/en/digitallab"
                        >
                            Purolator Digital Lab
                        </ExternalLink>{" "}
                        and hobby building full-stack projects in my free time.
                    </p>,
                ]}
            />
        </Card>
    );
}

export default async function Home() {
    const monkeytype = await getMonkeytypeData();

    return (
        <main
            id="content"
            className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6"
        >
            <div className="rise-in grid w-full max-w-4xl gap-4 md:grid-cols-3">
                <ProfileCard />
                <AboutCard className="md:col-span-2" />
                <RecentlyListenedCard className="md:col-span-2" />
                <MonkeyTypeStatsCard stats={monkeytype} />
            </div>
        </main>
    );
}
