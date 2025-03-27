/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/Student_Hub',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  assetPrefix: '/Student_Hub/',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  /* config options here */
};

module.exports = nextConfig; 