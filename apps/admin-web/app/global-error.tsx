'use client';

/**
 * Global Error Boundary
 * Catches errors in the root layout and reports them to Sentry
 * This is a fallback for errors that occur before the app error boundary
 */

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global-error',
      },
      contexts: {
        errorInfo: {
          digest: error.digest,
          message: error.message,
          stack: error.stack,
        },
      },
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by global error boundary:', error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#f9fafb',
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 20px',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '12px',
              color: '#111827',
            }}>
              Application Error
            </h1>

            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px',
            }}>
              {error.message || 'A critical error occurred'}
            </p>

            {error.digest && (
              <p style={{
                fontSize: '12px',
                color: '#9ca3af',
                marginBottom: '24px',
              }}>
                Error ID: {error.digest}
              </p>
            )}

            <button
              onClick={reset}
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '12px',
              }}
            >
              Try Again
            </button>

            <button
              onClick={() => (window.location.href = '/')}
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Go Home
            </button>

            <p style={{
              fontSize: '12px',
              color: '#9ca3af',
              marginTop: '24px',
            }}>
              This error has been automatically reported.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
