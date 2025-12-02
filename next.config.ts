import type { NextConfig } from "next";
import withPWA from "next-pwa";
import runtimeCaching from "next-pwa/cache";

const baseConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

const withPWAConfig =
  process.env.NODE_ENV === "production"
    ? withPWA({
        dest: "public",
        disable: false,
        register: false, // manual register
        skipWaiting: true,
        runtimeCaching,
        fallbacks: {},
        additionalManifestEntries: [
          { url: "/", revision: `${Date.now()}` },
          { url: "/notes", revision: `${Date.now()}` },
        ],
        buildExcludes: [
          /middleware-manifest\.json$/,
          /dynamic-css-manifest\.json$/,
        ],
      })
    : (config: NextConfig) => config;

export default withPWAConfig(baseConfig);
