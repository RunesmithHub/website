import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  trailingSlash: false,
  poweredByHeader: false,
  reactStrictMode: true,
  images: { unoptimized: true },
  productionBrowserSourceMaps: false,
};

export default config;
