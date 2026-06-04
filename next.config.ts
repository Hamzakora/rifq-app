import type { NextConfig } from "next";

const isAndroidExport = process.env.RIFQ_ANDROID_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isAndroidExport
    ? {
        output: "export" as const,
        trailingSlash: true,
        images: {
          unoptimized: true
        }
      }
    : {})
};

export default nextConfig;
