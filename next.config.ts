import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react", "recharts"]
  },
  reactStrictMode: true
};

export default nextConfig;
