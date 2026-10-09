import Image from "next/image";
import RecentlyListenedCard from "@/components/RecentlyListenedCard";
// import SpotifyCard from "@/components/SpotifyCard";
import MonkeyTypeStatsCard from "@/components/MonkeyTypeStatsCard";
import { getMonkeytypeData } from "@/lib/api";

const SOCIAL_LINKS = [
    {
        href: "https://github.com/rredwiz",
        icon: "/github-icon.svg",
        label: "GitHub profile",
    },
    {
        href: "https://www.linkedin.com/in/andrew-dutka-65368135a/",
        icon: "/linkedin-icon.svg",
        label: "LinkedIn profile",
    },
    {
        href: "/Andrew-Dutka-Resume.pdf",
        icon: "/document.svg",
        label: "Resume (PDF)",
    },
] as const;

export default async function Home() {
    const monkeytype = await getMonkeytypeData();

    return (
        <main>
            <div className="flex justify-center items-center min-h-screen min-w-screen">
                <div className="flex m-8 mt-20 mb-20 md:mt-0 md:mb-8 flex-col md:grid md:grid-cols-3 gap-4 w-3xl">
                    <div className="flex gap-4 sm:gap-0 md:block p-4 col-span-1 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
                        <div className="flex flex-col md:flex-row md:justify-around gap-2 items-center justify-center">
                            <Image
                                src="/pixierou.png"
                                className="mb-2 md:w-20"
                                width={153}
                                height={153}
                                alt="Andrew's Minecraft character"
                                priority
                            />
                            <div className="flex justify-center md:justify-start items-center gap-4">
                                {SOCIAL_LINKS.map(
                                    ({ href, icon, label }, index) => (
                                        <a
                                            key={href}
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`${label} (opens in a new tab)`}
                                        >
                                            <Image
                                                src={icon}
                                                className={`w-6 hover:scale-110 transition-all duration-300${
                                                    index ===
                                                    SOCIAL_LINKS.length - 1
                                                        ? " mr-1"
                                                        : ""
                                                }`}
                                                width={24}
                                                height={24}
                                                alt=""
                                            />
                                        </a>
                                    ),
                                )}
                            </div>
                        </div>
                        <div className="pointer-events-none md:block flex flex-col justify-center md:m-0 m-auto">
                            <h1 className="text-white md:text-2xl sm:text-5xl text-4xl">
                                Hey, I&apos;m{" "}
                                <span className="md:font-semibold font-bold">
                                    Andrew
                                </span>
                                .
                            </h1>
                            <p className="md:text-sm text-lg text-gray-400 md:mt-0 mt-2">
                                CS Student &amp; Developer
                            </p>
                            <div className="flex mt-2 gap-1 justify-start items-center">
                                <Image
                                    src="/location-icon.svg"
                                    className="w-4"
                                    width={16}
                                    height={16}
                                    alt=""
                                    aria-hidden="true"
                                />
                                <p className="md:text-xs text-sm text-gray-400">
                                    Nova Scotia, Canada
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 col-span-2 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
                        <p className="text-xs text-white font-mono">
                            <a
                                href="https://github.com/rredwiz"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                andrew<span className="text-gray-400">/</span>
                                README
                                <span className="text-gray-400">.md</span>
                            </a>
                        </p>
                        <div className="mt-2">
                            <h2 className="text-white font-semibold text-2xl border-b-1 border-gray-600 inline">
                                About Me
                            </h2>
                        </div>
                        <div className="mt-2">
                            <p className="text-white">
                                I&apos;m a currently-enrolled rising junior
                                Computer Science student and software developer.
                                At the moment, I&apos;m interning at{" "}
                                <a
                                    href="https://www.purolator.com/en/digitallab"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-300 border-b border-gray-300/70 transition-colors duration-200 ease-in-out hover:text-white hover:border-white"
                                >
                                    Purolator Digital Lab
                                </a>{" "}
                                and hobby building full-stack projects in my
                                free time.
                            </p>
                        </div>
                    </div>
                    <RecentlyListenedCard />
                    {/* <SpotifyCard /> */}
                    <MonkeyTypeStatsCard stats={monkeytype} />
                </div>
            </div>
        </main>
    );
}
