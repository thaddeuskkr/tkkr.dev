// @ts-check

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
    allowedDevOrigins: ["tk-air.tkkr"],
    output: "standalone",
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
