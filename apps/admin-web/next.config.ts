import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@fleetrent/shared-types'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@tanstack/react-query'],
  },
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
