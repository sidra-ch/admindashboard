'use server';

export async function throwSentryServerActionError() {
  throw new Error('Sentry Server Action Test Error!');
}
