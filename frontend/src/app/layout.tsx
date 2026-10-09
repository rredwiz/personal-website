import type { Metadata, Viewport } from "next";
import { Figtree, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Background from "@/components/background/Background";
import { BASE_COLOR } from "@/lib/theme";
import { cx } from "@/lib/cx";
import VimShell from "@/components/vim/VimShell";
import { COLORSCHEME_BOOT_SCRIPT } from "@/components/vim/colorschemes";
import Nav from "@/components/navigation/Nav";
import LayoutTransition from "@/components/animations/LayoutTransition";

// Figtree (smooth, open shapes) carries the content; JetBrains Mono carries
// everything Vim: file names, line numbers, the status pill, numbers.
const figtree = Figtree({
    subsets: ["latin"],
    variable: "--font-figtree",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-jetbrains",
    display: "swap",
});

const SITE_URL = "https://andster.dev";
const TITLE = "andrew's website";
const DESCRIPTION = "my personal portfolio and website.";

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: TITLE,
    description: DESCRIPTION,
    openGraph: {
        title: TITLE,
        description: DESCRIPTION,
        url: SITE_URL,
        siteName: TITLE,
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
    },
};

export const viewport: Viewport = {
    themeColor: BASE_COLOR,
    colorScheme: "dark",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={cx(
                figtree.variable,
                jetbrainsMono.variable,
                "bg-canvas font-sans text-ink antialiased",
            )}
            // The boot script may set data-theme before React hydrates.
            suppressHydrationWarning
        >
            <head>
                <script
                    // Applies a saved :colorscheme before first paint (no flash).
                    dangerouslySetInnerHTML={{
                        __html: COLORSCHEME_BOOT_SCRIPT,
                    }}
                />
            </head>
            <body className="isolate flex min-h-dvh flex-col overflow-x-clip">
                <a
                    href="#content"
                    className="sr-only rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
                >
                    Skip to content
                </a>
                <Background />
                {/* Vim, modernised: a floating tab pill, buffers, a floating status pill. */}
                <header className="pointer-events-none sticky top-0 z-30 flex justify-center px-4 pt-4">
                    <Nav className="pointer-events-auto" />
                </header>
                <LayoutTransition>{children}</LayoutTransition>
                {/* Room for the fixed status pill. */}
                <div aria-hidden="true" className="h-20 shrink-0" />
                <VimShell />
                <Analytics />
            </body>
        </html>
    );
}
