/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow images from the local data directory
  images: {
    remotePatterns: [],
    unoptimized: true, // We're serving local images
  },
  // Transpile the workspace packages
  transpilePackages: ['@jrpg-visualizer/core'],
  // Experimental features for better SSE support
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

module.exports = nextConfig;
