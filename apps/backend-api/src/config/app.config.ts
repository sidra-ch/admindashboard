export default () => ({
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  sentryDsn: process.env.SENTRY_DSN ?? '',
});
