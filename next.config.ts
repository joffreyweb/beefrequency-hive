import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sweph"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
