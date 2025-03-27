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
  /* config options here */
};

module.exports = nextConfig; 