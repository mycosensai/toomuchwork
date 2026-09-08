import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // QuietFlow ships as a static PWA / WebView build — no server required.
  // Mobile: viewport scaling, touch events, and standalone (instalable) mode.
  reactStrictMode: true,
};

export default nextConfig;
