import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo root holds the v1 static HTML and the parent studio carries its
  // own lockfiles. Pin Turbopack's root to this v2 app so module resolution
  // and file tracing stay scoped to v2.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
