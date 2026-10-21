import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // The ".nosync" suffix keeps iCloud from syncing (and duplicating) build output: this folder lives in Documents.
  distDir: ".next.nosync",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
