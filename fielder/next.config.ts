import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const nextConfig = (phase: string): NextConfig => {
  // Inject IS_BUILD_TIME to skip external API calls during static generation
  // This prevents rate limiting from Weather/NPN APIs when generating 7,700+ pages
  const isBuildTime = phase === PHASE_PRODUCTION_BUILD;

  return {
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
      IS_BUILD_TIME: isBuildTime ? 'true' : 'false',
    },
  };
};

export default nextConfig;
