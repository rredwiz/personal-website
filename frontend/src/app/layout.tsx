import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Background from "@/components/background/Background";
import { BASE_COLOR } from "@/lib/theme";
import { cx } from "@/lib/cx";
import WarningElement from "@/components/WarningElement";
import Nav from "@/components/navigation/Nav";
import LayoutTransition from "@/components/animations/LayoutTransition";

const geist = Geist({
    subsets: ["latin"],
    variable: "--font-geist",
    display: "swap",
});

const geistMono = Geist_Mono({
    subsets: ["latin"],
    variable: "--font-geist-mono",
    display: "swap",
});

// Display face for names and headings; the opsz axis tightens it at large sizes.
const bricolage = Bricolage_Grotesque({
    subsets: ["latin"],
    variable: "--font-bricolage",
    display: "swap",
    axes: ["opsz"],
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
                geist.variable,
                geistMono.variable,
                bricolage.variable,
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
                <header className="pointer-events-none sticky top-0 z-20 flex justify-center px-4 pt-4 sm:pt-5">
                    <Nav className="pointer-events-auto" />
                </header>
                <LayoutTransition>{children}</LayoutTransition>
                <footer className="flex justify-center px-4 pt-2 pb-6">
                    <WarningElement />
                </footer>
                <Analytics />
            </body>
        </html>
    );
}
