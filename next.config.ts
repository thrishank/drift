import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(
    config,
    {
      isServer,
      //  dev
    }
  ) {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        dns: false,
        tls: false,
      };
    }

    return config;
  },
};

export default nextConfig;
