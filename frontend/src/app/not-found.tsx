import Link from "next/link";
import Avatar from "@/components/Avatar";
import { Card, CardFileBar } from "@/components/ui/Card";
import { FileTextIcon, HomeIcon } from "@/components/icons";

export default function NotFound() {
    return (
        <main
            id="content"
            className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6"
        >
            <div className="rise-in w-full max-w-md">
                <Card as="section" className="text-center">
                    <CardFileBar
                        icon={<FileTextIcon className="size-3.5" />}
                        className="justify-center"
                    >
                        <span>
                            andrew<span className="text-ink-faint/60">/</span>
                            <span className="text-ink-soft">404</span>.md
                        </span>
                    </CardFileBar>
                    <Avatar scale={5} preload className="mx-auto mt-2" />
                    <p className="mt-5 font-mono text-sm text-accent">404</p>
                    <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
                        Nothing here.
                    </h1>
                    <p className="mt-2 text-ink-muted">
                        This page doesn&apos;t exist, or it wandered off.
                    </p>
                    <Link
                        href="/"
                        className="mt-6 mb-1 inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.06] px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-white/10"
                    >
                        <HomeIcon className="size-4" />
                        Back home
                    </Link>
                </Card>
            </div>
        </main>
    );
}
