import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Loaded from node_modules at runtime instead of being bundled into the
  // server build: pdf-parse's pdfjs engine resolves its worker file relative
  // to its own module path (bundling breaks that).
  serverExternalPackages: ["pdf-parse"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
