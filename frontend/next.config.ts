import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    poweredByHeader: false,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "lastfm.freetls.fastly.net",
                port: "",
                pathname: "/i/u/**",
            },
        ],
    },
};

export default nextConfig;
