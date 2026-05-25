'use client';

/**
 * Error Boundary for App Router
 * Catches errors in the app directory and reports them to Sentry
 */

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'app-error',
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
      console.error('Error caught by error boundary:', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md border-destructive/50 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Something went wrong!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              {error.message || 'An unexpected error occurred'}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={reset}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => (window.location.href = '/')}
              variant="outline"
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            This error has been automatically reported to our team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
