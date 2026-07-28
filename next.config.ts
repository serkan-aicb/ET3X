import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // keep dev-tools badge out of progress screenshots
  devIndicators: false,
};

export default nextConfig;
