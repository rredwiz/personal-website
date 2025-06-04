import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Background from "@/components/background/Background";
import WarningElement from "@/components/WarningElement";

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
            <body className="bg-[#232323]">
                <Background />
                {children}
                <Analytics />
                <WarningElement className="absolute bottom-5 left-[50%] translate-x-[-50%] cursor-default" />
            </body>
        </html>
    );
}
