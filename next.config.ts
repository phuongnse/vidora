import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zh0k80ftej.ufs.sh",
      },
    ],
  },
};

export default nextConfig;
