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
  async rewrites() {
    return {
      // beforeFiles: `/@user` is otherwise treated as a parallel-route slot
      // and the first navigation can render an empty shell until refresh.
      beforeFiles: [
        { source: "/@:username", destination: "/u/:username" },
        { source: "/@:username/:path*", destination: "/u/:username/:path*" },
      ],
    };
  },
};

export default nextConfig;
