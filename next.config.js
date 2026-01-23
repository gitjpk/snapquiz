/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
