import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Background from "@/components/background/Background";
import WarningElement from "@/components/WarningElement";
import Nav from "@/components/navigation/Nav";
import LayoutTransition from "@/components/animations/LayoutTransition";

export const metadata: Metadata = {
    title: "andrew's website",
    description: "my personal portfolio and website.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="bg-[#232323]">
            <body className="bg-[#232323] relative">
                <Background />
                <Nav className="absolute top-5 left-[50%] transition-opacity duration-1000 delay-1000 ease-in-out translate-x-[-50%]" />
                <LayoutTransition>{children}</LayoutTransition>
                <Analytics />
                <WarningElement className="absolute bottom-1 md:bottom-5 left-[50%] translate-x-[-50%] cursor-default" />
            </body>
        </html>
    );
}
