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
        fallbacks: {
          document: "/offline",
        },
        additionalManifestEntries: [
          { url: "/", revision: `${Date.now()}` },
          { url: "/notes", revision: `${Date.now()}` },
          { url: "/offline", revision: `${Date.now()}` },
        ],
        buildExcludes: [/middleware-manifest\.json$/],
      })
    : (config: NextConfig) => config;

export default withPWAConfig(baseConfig);
