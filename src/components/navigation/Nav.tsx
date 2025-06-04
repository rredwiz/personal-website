"use client";
import Link from "next/link";
import Image from "next/image";
import React, { ReactNode } from "react";

export default function Nav({ className }: { className?: ReactNode }) {
    return (
        <nav className={`${className}`}>
            <div className="grid rounded-xl bg-black/25 border-gray-500/25 border-1 grid-cols-2">
                <Link
                    className="flex rounded-xl transition-colors duration-400 hover:bg-gray-500/20 p-1.5 justify-center items-center"
                    href="/"
                >
                    <Image
                        src="/home-icon.svg"
                        width={24}
                        height={24}
                        alt="home icon"
                    />
                </Link>
                <Link
                    className="flex rounded-xl transition-colors duration-400 hover:bg-gray-500/20 p-1.5 justify-center items-center"
                    href="/projects"
                >
                    <Image
                        src="/project-icon.svg"
                        width={16}
                        height={16}
                        alt="projects icon"
                    />
                </Link>
            </div>
        </nav>
    );
}
