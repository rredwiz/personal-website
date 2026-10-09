import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Background from "@/components/background/Background";
import { BASE_COLOR } from "@/lib/theme";
import WarningElement from "@/components/WarningElement";
import Nav from "@/components/navigation/Nav";
import LayoutTransition from "@/components/animations/LayoutTransition";

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
        <html lang="en" className="bg-[#232323]">
            <body className="bg-[#232323] relative min-h-screen overflow-x-hidden">
                <Background />
                <Nav className="absolute top-5 left-[50%] z-10 transition-opacity duration-1000 delay-1000 ease-in-out translate-x-[-50%]" />
                <LayoutTransition>{children}</LayoutTransition>
                <Analytics />
                <WarningElement className="absolute bottom-4 md:bottom-5 left-[50%] translate-x-[-50%] cursor-default" />
            </body>
        </html>
    );
}
