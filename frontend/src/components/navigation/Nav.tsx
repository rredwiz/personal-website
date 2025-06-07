import Link from "next/link";
import Image from "next/image";
import React, { ReactNode } from "react";

export default function Nav({
    className,
    page,
}: {
    className?: ReactNode;
    page?: string;
}) {
    return (
        <nav className={`${className}`}>
            <div className="grid rounded-xl bg-black/25 border-gray-500/25 border-1 grid-cols-2">
                <Link
                    className="flex rounded-xl transition-colors duration-400 hover:bg-gray-500/20 p-1.5 justify-center items-center"
                    href="/"
                >
                    <div
                        className={
                            page === "home" ? "border-b border-gray-400/90" : ""
                        }
                    >
                        <Image
                            src="/home-icon.svg"
                            width={24}
                            height={24}
                            alt="home icon"
                        />
                    </div>
                </Link>
                <Link
                    className="flex rounded-xl transition-colors duration-400 hover:bg-gray-500/20 p-1.5 justify-center items-center"
                    href="/projects"
                >
                    <div
                        className={`${
                            page === "projects"
                                ? "border-b border-gray-400/90"
                                : ""
                        } w-6 h-6 flex justify-center items-center`}
                    >
                        <Image
                            src="/project-icon.svg"
                            width={16}
                            height={16}
                            alt="projects icon"
                        />
                    </div>
                </Link>
            </div>
        </nav>
    );
}
