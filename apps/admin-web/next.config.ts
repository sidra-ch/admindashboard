import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@fleetrent/shared-types'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
