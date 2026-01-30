/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker deployment
  output: 'standalone',
  // Allow larger file uploads (50MB) - for document parsing
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Allow images from external sources if needed for quiz media
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
