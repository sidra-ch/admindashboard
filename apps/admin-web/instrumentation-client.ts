import * as Sentry from '@sentry/nextjs';

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV,
  tracesSampleRate: 0.2,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],
  ignoreErrors: [
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications.',
  ],
  beforeSend(event) {
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }

    return event;
  },
  debug: false,
});