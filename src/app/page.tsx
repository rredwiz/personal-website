import Image from "next/image";
import Nav from "@/components/navigation/Nav";

export default function Home() {
    return (
        <main>
            <div
                key={"homepage"}
                className="flex justify-center items-center h-screen w-screen"
            >
                <div className="flex m-8 flex-col md:grid md:grid-cols-3 gap-4 w-3xl">
                    <div className="flex gap-4 sm:gap-0 md:block p-4 col-span-1 bg-black/25 h-auto rounded-xl shadow-md border border-gray-500/25">
                        <div className="flex flex-col md:flex-row md:justify-around gap-2 items-center justify-center">
                            <Image
                                src="/ImageIcon.png"
                                className="mb-2 rounded-full md:w-20"
                                width={153}
                                height={153}
                                alt="minecraft character image"
                            />
                            <div className="flex justify-center md:justify-start items-center gap-4">
                                <a
                                    href="https://github.com/rredwiz"
                                    target="_blank"
                                >
                                    <Image
                                        src="/github-icon.svg"
                                        className="w-6 hover:scale-110"
                                        width={24}
                                        height={24}
                                        alt="github icon"
                                    />
                                </a>
                                <a
                                    href="https://www.linkedin.com/in/andrew-dutka-65368135a/"
                                    target="_blank"
                                >
                                    <Image
                                        src="/linkedin-icon.svg"
                                        className="w-6 hover:scale-110"
                                        width={24}
                                        height={24}
                                        alt="linkedin icon"
                                    />
                                </a>
                                <a
                                    href="https://bsky.app/profile/andster.dev"
                                    target="_blank"
                                >
                                    <Image
                                        src="/blueskyLogo-icon.svg"
                                        className="w-6 hover:scale-110 mr-1"
                                        width={24}
                                        height={24}
                                        alt="blusky social media icon"
                                    />
                                </a>
                            </div>
                        </div>
                        <div className="pointer-events-none md:block flex flex-col justify-center md:m-0 m-auto">
                            <h1 className="text-white md:text-2xl sm:text-5xl text-4xl">
                                Hey, I'm{" "}
                                <span className="md:font-semibold font-bold">
                                    Andrew
                                </span>
                                .
                            </h1>
                            <p className="md:text-sm text-lg text-gray-400 md:mt-0 mt-2">
                                CS Student & Developer
                            </p>
                            <div className="flex mt-2 gap-1 justify-start items-center">
                                <Image
                                    src="/location-icon.svg"
                                    className="w-4"
                                    width={16}
                                    height={16}
                                    alt="location pin icon"
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
                            >
                                andrew<span className="text-gray-400">/</span>
                                README
                                <span className="text-gray-400">.md</span>
                            </a>
                        </p>
                        <div className="mt-2">
                            <h3 className="text-white font-semibold text-2xl border-b-1 border-gray-600 inline">
                                Slice of Me
                            </h3>
                        </div>
                        <div className="mt-2">
                            <p className="text-white text-md">
                                I'm a currently-enrolled rising sophomore
                                Computer Science student and dedicated
                                programming hobbyist. At the moment, I'm
                                occupying my time learning how to use a variety
                                of full-stack development tools and frameworks
                                to build cool things.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
