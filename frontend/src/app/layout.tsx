import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Background from "@/components/background/Background";
import { BASE_COLOR } from "@/lib/theme";
import { cx } from "@/lib/cx";
import StatusLine from "@/components/vim/StatusLine";
import Nav from "@/components/navigation/Nav";
import LayoutTransition from "@/components/animations/LayoutTransition";

// One smooth monospace face for everything: it's an editor font, and the site is
// dressed as an editor.
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
                jetbrainsMono.variable,
                "bg-canvas font-sans text-ink antialiased",
            )}
        >
            <body className="isolate flex min-h-dvh flex-col overflow-x-clip">
                <a
                    href="#content"
                    className="sr-only rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
                >
                    Skip to content
                </a>
                <Background />
                {/* The page is dressed as a Vim session: tabline, buffers, statusline. */}
                <header className="sticky top-0 z-20">
                    <Nav />
                </header>
                <LayoutTransition>{children}</LayoutTransition>
                <footer className="relative z-20 md:sticky md:bottom-0">
                    <StatusLine />
                </footer>
                <Analytics />
            </body>
        </html>
    );
}
