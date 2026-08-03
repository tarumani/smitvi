import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Fly.io / Docker standalone image
  output: "standalone",
  // Keep PDF libs outside the Next bundle so pdf.worker.mjs resolves from node_modules
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
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
