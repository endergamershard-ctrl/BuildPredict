import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export so the Tauri desktop shell can serve the app from disk.
  output: "export",
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
