import type { NextConfig } from "next";
const nextConfig: NextConfig = {
    turbopack: {
        rules: {
            "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
        },
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "no-referrer" },
                    { key: "X-Frame-Options", value: "DENY" },
                ],
            },
        ];
    },
    allowedDevOrigins: ["tk-air.tkkr"],
};
export default nextConfig;
