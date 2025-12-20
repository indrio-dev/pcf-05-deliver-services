import type { NextConfig } from "next";

// Detect CI/build environment (Vercel sets CI=true during builds)
// This skips external API calls during static generation to avoid rate limits
// when generating 7,700+ pages
const isCIBuild = process.env.CI === 'true';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
  },
  env: {
    // Pages check this to skip Weather/NPN API calls during build
    // Falls back to estimated GDD values and static phenology data
    IS_BUILD_TIME: isCIBuild ? 'true' : 'false',
  },
};

export default nextConfig;
