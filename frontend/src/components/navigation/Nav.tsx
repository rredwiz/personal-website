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

/** Vim's tabline as a floating pill: one tab per page, numbered like `1gt`. */
export default function Nav({ className }: { className?: string }) {
    const pathname = usePathname();
    const reducedMotion = useReducedMotion();

    return (
        <nav
            aria-label="Primary"
            className={cx(
                "rounded-full border border-line bg-surface p-1 shadow-float backdrop-blur-xl",
                className,
            )}
        >
            <ul className="flex items-center gap-1">
                {TABS.map((tab, index) => {
                    const active = isActivePath(pathname, tab.href);
                    const [name, extension] = tab.file.split(".");
                    return (
                        <li key={tab.href} className="relative">
                            {active && (
                                // Slides between tabs when the route changes.
                                <motion.span
                                    layoutId="tabline-active"
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
                                href={tab.href}
                                aria-current={active ? "page" : undefined}
                                className={cx(
                                    "relative flex items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-[13px] transition-colors duration-200",
                                    active
                                        ? "text-ink"
                                        : "text-ink-muted hover:text-ink",
                                )}
                            >
                                <span
                                    aria-hidden="true"
                                    className="text-[11px] text-ink-faint"
                                >
                                    {index + 1}
                                </span>
                                <span>
                                    {name}
                                    <span
                                        aria-hidden="true"
                                        className="text-ink-faint"
                                    >
                                        .{extension}
                                    </span>
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
