import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@mdxeditor/editor'],
  webpack: (config) => {
    // Handle @mdxeditor/editor's dynamic imports
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
};

export default nextConfig;
