export default function TestSentryServerComponent() {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('Sentry Server Component Test Error!');
  }

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Sentry server component test</h1>
      <p>This route intentionally throws only in development mode.</p>
    </main>
  );
}
