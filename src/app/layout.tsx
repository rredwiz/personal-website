import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

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
                {children}
                <Analytics />
            </body>
        </html>
    );
}
