import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const sentryAuthToken =
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_AUTH_TOKEN !== 'YOUR_AUTH_TOKEN'
    ? process.env.SENTRY_AUTH_TOKEN
    : undefined;

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

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || 'mssidra',
  project: process.env.SENTRY_PROJECT || 'javascript-nextjs',
  authToken: sentryAuthToken,
  silent: true,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
  disableLogger: true,
  automaticVercelMonitors: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
