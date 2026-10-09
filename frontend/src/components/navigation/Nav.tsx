"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { TABS } from "@/components/vim/commands";
import { cx } from "@/lib/cx";

export function isActivePath(pathname: string | null, href: string): boolean {
    if (!pathname) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
}

/** Vim's tabline: one tab per page, the current one in reverse video. */
export default function Nav({ className }: { className?: string }) {
    const pathname = usePathname();
    const reducedMotion = useReducedMotion();

    return (
        <nav
            aria-label="Primary"
            className={cx(
                "flex h-9 items-stretch border-b border-line bg-surface font-mono text-xs backdrop-blur-md",
                className,
            )}
        >
            <ul className="flex">
                {TABS.map((tab, index) => {
                    const active = isActivePath(pathname, tab.href);
                    const [name, extension] = tab.file.split(".");
                    return (
                        <li
                            key={tab.href}
                            className="relative flex border-r border-line"
                        >
                            {active && (
                                <motion.span
                                    layoutId="tabline-active"
                                    aria-hidden="true"
                                    className="absolute inset-0 bg-ink"
                                    transition={
                                        reducedMotion
                                            ? { duration: 0 }
                                            : {
                                                  type: "spring",
                                                  bounce: 0.15,
                                                  duration: 0.4,
                                              }
                                    }
                                />
                            )}
                            <Link
                                href={tab.href}
                                aria-current={active ? "page" : undefined}
                                className={cx(
                                    "relative flex items-center gap-2 px-3.5 transition-colors duration-200",
                                    active
                                        ? "font-semibold text-canvas"
                                        : "text-ink-muted hover:bg-white/5 hover:text-ink",
                                )}
                            >
                                <span
                                    aria-hidden="true"
                                    className={
                                        active
                                            ? "text-canvas/55"
                                            : "text-ink-faint"
                                    }
                                >
                                    {index + 1}
                                </span>
                                <span>
                                    {name}
                                    <span aria-hidden="true">.{extension}</span>
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
            <span className="ml-auto hidden items-center px-4 text-ink-faint sm:flex">
                andster.dev
            </span>
        </nav>
    );
}
