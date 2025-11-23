import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
