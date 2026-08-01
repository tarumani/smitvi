import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Fly.io / Docker standalone image
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  poweredByHeader: false,
};

export default nextConfig;
