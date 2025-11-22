import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/feed",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
