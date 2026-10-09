"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const LINK_CLASS =
    "flex rounded-xl transition-colors duration-400 hover:bg-gray-500/20 p-1.5 justify-center items-center";
const ACTIVE_CLASS = "border-b border-gray-400/90";

export function isActivePath(pathname: string | null, href: string): boolean {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Nav({ className }: { className?: string }) {
    const pathname = usePathname();
    const homeActive = isActivePath(pathname, "/");
    const projectsActive = isActivePath(pathname, "/projects");

    return (
        <nav className={className} aria-label="Primary">
            <div className="grid rounded-xl bg-black/25 border-gray-500/25 border-1 grid-cols-2">
                <Link className={LINK_CLASS} href="/" aria-current={homeActive ? "page" : undefined}>
                    <div className={homeActive ? ACTIVE_CLASS : ""}>
                        <Image src="/home-icon.svg" width={24} height={24} alt="Home" />
                    </div>
                </Link>
                <Link className={LINK_CLASS} href="/projects" aria-current={projectsActive ? "page" : undefined}>
                    <div className={`${projectsActive ? ACTIVE_CLASS : ""} w-6 h-6 flex justify-center items-center`}>
                        <Image src="/project-icon.svg" width={16} height={16} alt="Projects" />
                    </div>
                </Link>
            </div>
        </nav>
    );
}
