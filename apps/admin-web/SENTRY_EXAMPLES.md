# 📖 Sentry Usage Examples

Complete examples for using Sentry in your Next.js 15 App Router application.

---

## 🎯 Table of Contents

1. [Client Components](#client-components)
2. [Server Components](#server-components)
3. [API Routes](#api-routes)
4. [Server Actions](#server-actions)
5. [Middleware](#middleware)
6. [Custom Hooks](#custom-hooks)
7. [Performance Tracking](#performance-tracking)
8. [User Context](#user-context)
9. [Custom Tags & Context](#custom-tags--context)
10. [Advanced Patterns](#advanced-patterns)

---

## 1. Client Components

### Basic Error Handling

```typescript
'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function ClientComponent() {
  const [data, setData] = useState(null);

  const handleClick = async () => {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      // Capture error with context
      Sentry.captureException(error, {
        tags: {
          component: 'ClientComponent',
          action: 'fetch-data',
        },
        contexts: {
          fetch: {
            url: '/api/data',
            method: 'GET',
          },
        },
      });

      // Show user-friendly message
      alert('Failed to load data');
    }
  };

  return <button onClick={handleClick}>Load Data</button>;
}
```

### Form Submission Error

```typescript
'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function ContactForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Form submission failed');
      }

      alert('Form submitted successfully!');
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          form: 'contact',
          action: 'submit',
        },
        contexts: {
          formData: {
            // Don't send sensitive data!
            fields: Object.keys(data),
            fieldCount: Object.keys(data).length,
          },
        },
        level: 'error',
      });

      alert('Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

---

## 2. Server Components

### Data Fetching Error

```typescript
// app/dashboard/page.tsx
import * as Sentry from '@sentry/nextjs';
import { redirect } from 'next/navigation';

async function getData() {
  try {
    const response = await fetch('https://api.example.com/data', {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    return response.json();
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        component: 'DashboardPage',
        function: 'getData',
      },
      contexts: {
        api: {
          url: 'https://api.example.com/data',
          method: 'GET',
        },
      },
    });

    // Re-throw to trigger error boundary
    throw error;
  }
}

export default async function DashboardPage() {
  const data = await getData();

  return (
    <div>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

### Database Query Error

```typescript
// app/users/[id]/page.tsx
import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function UserPage({ params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: { posts: true },
    });

    if (!user) {
      notFound();
    }

    return (
      <div>
        <h1>{user.name}</h1>
        {/* render user data */}
      </div>
    );
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        page: 'UserPage',
        userId: params.id,
        database: 'prisma',
      },
      contexts: {
        query: {
          model: 'User',
          operation: 'findUnique',
          id: params.id,
        },
      },
    });

    throw error; // Will be caught by error.tsx
  }
}
```

---

## 3. API Routes

### GET Request with Error Handling

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const transaction = Sentry.startTransaction({
    name: 'GET /api/users',
    op: 'http.server',
  });

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Add span for database query
    const span = transaction.startChild({
      op: 'db.query',
      description: 'Fetch users from database',
    });

    const users = await prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });

    span.finish();

    return NextResponse.json({
      success: true,
      data: users,
      page,
      limit,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        route: '/api/users',
        method: 'GET',
      },
      contexts: {
        request: {
          url: request.url,
          method: request.method,
          headers: {
            'user-agent': request.headers.get('user-agent'),
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
      },
      { status: 500 }
    );
  } finally {
    transaction.finish();
  }
}
```

### POST Request with Validation

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = userSchema.parse(body);

    // Create user
    const user = await prisma.user.create({
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    // Handle validation errors differently
    if (error instanceof z.ZodError) {
      Sentry.captureMessage('User validation failed', {
        level: 'warning',
        tags: {
          route: '/api/users',
          errorType: 'validation',
        },
        contexts: {
          validation: {
            errors: error.errors,
          },
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    Sentry.captureException(error, {
      tags: {
        route: '/api/users',
        method: 'POST',
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create user',
      },
      { status: 500 }
    );
  }
}
```

---

## 4. Server Actions

### Form Action with Error Handling

```typescript
// app/actions/user.ts
'use server';

import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createUser(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;

    if (!name || !email) {
      throw new Error('Name and email are required');
    }

    const user = await prisma.user.create({
      data: { name, email },
    });

    // Revalidate and redirect
    revalidatePath('/users');
    redirect(`/users/${user.id}`);
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: 'createUser',
        type: 'server-action',
      },
      contexts: {
        formData: {
          hasName: formData.has('name'),
          hasEmail: formData.has('email'),
        },
      },
    });

    // Return error to client
    return {
      error: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
}
```

---

## 5. Middleware

### Authentication Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export function middleware(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token');

    if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
      // Log unauthorized access attempt
      Sentry.captureMessage('Unauthorized access attempt', {
        level: 'warning',
        tags: {
          middleware: 'auth',
          path: request.nextUrl.pathname,
        },
        contexts: {
          request: {
            url: request.url,
            method: request.method,
            ip: request.ip,
          },
        },
      });

      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        middleware: 'auth',
      },
    });

    // Fail open - allow request to continue
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

---

## 6. Custom Hooks

### useAsync Hook with Error Tracking

```typescript
// hooks/use-async.ts
'use client';

import { useState, useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const execute = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await asyncFunction();

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);

          // Capture error in Sentry
          Sentry.captureException(error, {
            tags: {
              hook: 'useAsync',
            },
            contexts: {
              async: {
                functionName: asyncFunction.name,
                dependencies: dependencies.length,
              },
            },
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    execute();

    return () => {
      cancelled = true;
    };
  }, dependencies);

  return { data, loading, error };
}
```

---

## 7. Performance Tracking

### Page Load Performance

```typescript
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function DashboardPage() {
  useEffect(() => {
    const transaction = Sentry.startTransaction({
      name: 'Dashboard Page Load',
      op: 'pageload',
    });

    // Track data fetching
    const fetchSpan = transaction.startChild({
      op: 'fetch',
      description: 'Fetch dashboard data',
    });

    fetch('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        fetchSpan.finish();

        // Track rendering
        const renderSpan = transaction.startChild({
          op: 'render',
          description: 'Render dashboard',
        });

        // Simulate render time
        setTimeout(() => {
          renderSpan.finish();
          transaction.finish();
        }, 100);
      })
      .catch((error) => {
        fetchSpan.finish();
        transaction.finish();
        Sentry.captureException(error);
      });
  }, []);

  return <div>Dashboard</div>;
}
```

### API Call Performance

```typescript
async function trackApiCall<T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startTransaction({
    name,
    op: 'api.call',
  });

  try {
    const result = await apiCall();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    Sentry.captureException(error);
    throw error;
  } finally {
    transaction.finish();
  }
}

// Usage
const data = await trackApiCall('Fetch Users', () =>
  fetch('/api/users').then((res) => res.json())
);
```

---

## 8. User Context

### Set User on Login

```typescript
// app/actions/auth.ts
'use server';

import * as Sentry from '@sentry/nextjs';

export async function login(email: string, password: string) {
  try {
    const user = await authenticateUser(email, password);

    // Set user context in Sentry
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    });

    return { success: true, user };
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: 'login',
      },
      contexts: {
        auth: {
          email, // Be careful with PII!
        },
      },
    });

    return { success: false, error: 'Login failed' };
  }
}
```

### Clear User on Logout

```typescript
// app/actions/auth.ts
'use server';

import * as Sentry from '@sentry/nextjs';

export async function logout() {
  try {
    // Clear session
    await clearSession();

    // Clear user context in Sentry
    Sentry.setUser(null);

    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        action: 'logout',
      },
    });

    return { success: false };
  }
}
```

---

## 9. Custom Tags & Context

### Add Custom Tags

```typescript
import * as Sentry from '@sentry/nextjs';

// Set global tags
Sentry.setTag('environment', 'production');
Sentry.setTag('version', '1.0.0');

// Set tags for specific error
Sentry.captureException(error, {
  tags: {
    feature: 'checkout',
    paymentMethod: 'stripe',
    currency: 'USD',
  },
});
```

### Add Custom Context

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.setContext('order', {
  id: 'order-123',
  total: 99.99,
  items: 3,
  status: 'pending',
});

Sentry.captureException(error, {
  contexts: {
    payment: {
      provider: 'stripe',
      amount: 99.99,
      currency: 'USD',
    },
    shipping: {
      method: 'express',
      address: 'redacted',
    },
  },
});
```

---

## 10. Advanced Patterns

### Retry with Exponential Backoff

```typescript
import * as Sentry from '@sentry/nextjs';

async function fetchWithRetry<T>(
  url: string,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Log retry attempt
      Sentry.captureMessage(`Retry attempt ${attempt + 1}/${maxRetries}`, {
        level: 'warning',
        tags: {
          url,
          attempt: attempt + 1,
        },
      });

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  // All retries failed
  Sentry.captureException(lastError, {
    tags: {
      url,
      maxRetries,
      finalAttempt: true,
    },
  });

  throw lastError;
}
```

### Circuit Breaker Pattern

```typescript
import * as Sentry from '@sentry/nextjs';

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      const error = new Error('Circuit breaker is open');
      Sentry.captureException(error, {
        tags: {
          pattern: 'circuit-breaker',
          state: 'open',
        },
      });
      throw error;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      Sentry.captureException(error, {
        tags: {
          pattern: 'circuit-breaker',
          failures: this.failures,
        },
      });
      throw error;
    }
  }

  private isOpen(): boolean {
    if (this.failures >= this.threshold) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      return timeSinceLastFailure < this.timeout;
    }
    return false;
  }

  private onSuccess() {
    this.failures = 0;
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
  }
}
```

---

## 📚 More Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Best Practices](https://docs.sentry.io/platforms/javascript/best-practices/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)

---

**Happy Error Tracking! 🎉**
