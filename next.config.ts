import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.ITCH_STATIC_EXPORT === "1"
    ? {
        output: "export",
      }
    : {}),
  allowedDevOrigins: ["192.168.1.87"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
