"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import type { ComponentType, SVGProps } from "react";
import { HomeIcon, PresentationIcon } from "@/components/icons";
import { cx } from "@/lib/cx";

const ITEMS: ReadonlyArray<{
    href: string;
    label: string;
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
}> = [
    { href: "/", label: "Home", Icon: HomeIcon },
    { href: "/projects", label: "Projects", Icon: PresentationIcon },
];

export function isActivePath(pathname: string | null, href: string): boolean {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Nav({ className }: { className?: string }) {
    const pathname = usePathname();
    const reducedMotion = useReducedMotion();

    return (
        <nav className={className} aria-label="Primary">
            <ul className="flex items-center gap-1 rounded-full border border-line bg-surface p-1 shadow-card backdrop-blur-md">
                {ITEMS.map(({ href, label, Icon }) => {
                    const active = isActivePath(pathname, href);
                    return (
                        <li key={href} className="relative">
                            {active && (
                                // Slides between items when the route changes.
                                <motion.span
                                    layoutId="nav-active-pill"
                                    aria-hidden="true"
                                    className="absolute inset-0 rounded-full bg-white/10 ring-1 ring-white/10 ring-inset"
                                    transition={
                                        reducedMotion
                                            ? { duration: 0 }
                                            : {
                                                  type: "spring",
                                                  bounce: 0.2,
                                                  duration: 0.45,
                                              }
                                    }
                                />
                            )}
                            <Link
                                href={href}
                                aria-current={active ? "page" : undefined}
                                className={cx(
                                    "relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-200",
                                    active
                                        ? "text-ink"
                                        : "text-ink-muted hover:text-ink",
                                )}
                            >
                                <Icon className="size-4" />
                                {label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
