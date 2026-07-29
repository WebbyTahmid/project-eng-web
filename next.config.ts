import type { NextConfig } from "next";

const isMobileBuild = process.env.BUILD_TARGET === 'mobile';

const nextConfig: NextConfig = {
  output: isMobileBuild ? 'export' : undefined,
  images: isMobileBuild ? { unoptimized: true } : undefined,
  /* config options here */
};

export default nextConfig;
