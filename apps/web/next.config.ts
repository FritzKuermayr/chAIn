import type { NextConfig } from "next";

// Note: `eslint.ignoreDuringBuilds` is a valid Next.js option but isn't part
// of the exported `NextConfig` type in 16.2.x. We assemble in two steps so
// the typed part stays type-checked and the untyped key passes through.
const typed: NextConfig = {
  // pdf-parse + mammoth use Node-only APIs — keep them out of the bundle.
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

const nextConfig = {
  ...typed,
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
