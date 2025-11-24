import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force rebuild 2
  async redirects() {
    return [
      {
        source: "/",
        destination: "/consumer",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
