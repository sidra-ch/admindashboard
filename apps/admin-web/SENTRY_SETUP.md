# 🚀 Sentry Setup Guide - Next.js 15 App Router

## ✅ Complete Production-Ready Setup

This project has a **fully configured** Sentry integration for Next.js 15 with App Router.

---

## 📁 File Structure

```
apps/admin-web/
├── app/
│   ├── error.tsx                    # ✅ App-level error boundary
│   ├── global-error.tsx             # ✅ Global error boundary
│   ├── test-sentry/                 # ✅ Testing page
│   │   └── page.tsx
│   └── api/
│       └── test-sentry/             # ✅ API route example
│           └── route.ts
├── sentry.client.config.ts          # ✅ Client-side config
├── sentry.server.config.ts          # ✅ Server-side config
├── sentry.edge.config.ts            # ✅ Edge runtime config
├── instrumentation.ts               # ✅ Next.js 15 bootstrap file
└── next.config.ts                   # ✅ Wrapped with withSentryConfig
```

---

## 🔧 Step 1: Install Dependencies

The required package is already installed:

```json
{
  "@sentry/nextjs": "^9.19.0"
}
```

If you need to reinstall:

```bash
cd apps/admin-web
npm install @sentry/nextjs
```

---

## 🔑 Step 2: Configure Environment Variables

### Create `.env.local` file:

```bash
cd apps/admin-web
cp .env.example .env.local
```

### Get Your Sentry Credentials:

1. **Create a Sentry Account:**
   - Go to https://sentry.io/signup/
   - Create a new organization

2. **Create a Project:**
   - Click "Create Project"
   - Select "Next.js"
   - Copy your DSN

3. **Get Auth Token:**
   - Go to https://sentry.io/settings/account/api/auth-tokens/
   - Click "Create New Token"
   - Name: "Next.js Source Maps"
   - Scopes: `project:releases`, `project:write`
   - Copy the token

4. **Find Organization & Project Slugs:**
   - Organization slug: In URL `https://sentry.io/organizations/[org-slug]/`
   - Project slug: In URL `https://sentry.io/organizations/[org]/projects/[project-slug]/`

### Update `.env.local`:

```env
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-public-key@o123456.ingest.sentry.io/123456
SENTRY_DSN=https://your-public-key@o123456.ingest.sentry.io/123456
SENTRY_AUTH_TOKEN=your-auth-token-here
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
NEXT_PUBLIC_ENVIRONMENT=development
```

---

## 🏗️ Step 3: Build Configuration

The `next.config.ts` is already configured with:

- ✅ `withSentryConfig` wrapper
- ✅ Source map upload enabled
- ✅ Instrumentation hook enabled
- ✅ Automatic Vercel monitors
- ✅ Tunnel route for ad-blocker bypass

---

## 🧪 Step 4: Test Sentry Integration

### Option 1: Use Testing Page (Recommended)

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit the testing page:
   ```
   http://localhost:3000/test-sentry
   ```

3. Click each test button:
   - ✅ **Client-Side Error** - Tests browser error tracking
   - ✅ **Unhandled Error** - Tests error boundary
   - ✅ **API Route Error** - Tests server-side tracking
   - ✅ **Custom Event** - Tests custom messages
   - ✅ **Performance Transaction** - Tests performance monitoring

### Option 2: Manual Testing

#### Test Client-Side Error:
```typescript
// In any client component
import * as Sentry from '@sentry/nextjs';

try {
  throw new Error('Test error');
} catch (error) {
  Sentry.captureException(error);
}
```

#### Test Server-Side Error:
```typescript
// In any API route or server component
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    throw new Error('Server error');
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Error occurred' }, { status: 500 });
  }
}
```

#### Test Error Boundary:
```typescript
// In any client component
'use client';

export default function TestPage() {
  // This will be caught by error.tsx
  throw new Error('Unhandled error');
}
```

---

## ✅ Step 5: Verify in Sentry Dashboard

1. **Go to Sentry Dashboard:**
   ```
   https://sentry.io/organizations/[your-org]/issues/
   ```

2. **Check for Errors:**
   - You should see your test errors appear within 5-10 seconds
   - Click on an error to see full details, stack trace, and context

3. **Check Performance:**
   ```
   https://sentry.io/organizations/[your-org]/performance/
   ```
   - View transactions and traces
   - See route performance metrics

4. **Check Session Replay:**
   ```
   https://sentry.io/organizations/[your-org]/replays/
   ```
   - Watch user sessions (if enabled)
   - See what happened before errors

---

## 🚀 Step 6: Production Deployment

### Vercel Deployment:

1. **Add Environment Variables in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all Sentry variables:
     ```
     NEXT_PUBLIC_SENTRY_DSN
     SENTRY_DSN
     SENTRY_AUTH_TOKEN
     SENTRY_ORG
     SENTRY_PROJECT
     NEXT_PUBLIC_ENVIRONMENT=production
     ```

2. **Deploy:**
   ```bash
   git push
   ```

3. **Verify Source Maps:**
   - After deployment, check Sentry → Settings → Source Maps
   - You should see uploaded source maps for your release

### Other Platforms:

Add the same environment variables to your hosting platform's configuration.

---

## 🔍 Debug Checklist

### ✅ Sentry Not Working?

1. **Check DSN is Set:**
   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. **Check Console for Sentry Logs:**
   - Open DevTools (F12) → Console
   - Look for Sentry initialization messages
   - In development, you should see: `Sentry Logger [Log]: Integration installed: ...`

3. **Check Network Tab:**
   - Open DevTools → Network
   - Filter by "sentry"
   - You should see requests to `sentry.io` or your tunnel route

4. **Verify Files Exist:**
   ```bash
   ls -la apps/admin-web/sentry.*.ts
   ls -la apps/admin-web/instrumentation.ts
   ls -la apps/admin-web/app/error.tsx
   ```

5. **Check Build Output:**
   ```bash
   npm run build
   ```
   - Look for "Sentry" in build logs
   - Should see "Uploading source maps to Sentry"

### ✅ Source Maps Not Uploading?

1. **Check Auth Token:**
   - Verify `SENTRY_AUTH_TOKEN` is set
   - Check token has correct scopes

2. **Check Organization & Project:**
   - Verify `SENTRY_ORG` and `SENTRY_PROJECT` are correct
   - Check they match your Sentry dashboard URL

3. **Check Build Logs:**
   ```bash
   npm run build 2>&1 | grep -i sentry
   ```

### ✅ Errors Not Appearing?

1. **Check Sample Rate:**
   - In development: `tracesSampleRate: 1.0` (100%)
   - In production: `tracesSampleRate: 0.1` (10%)

2. **Check Error Filters:**
   - Review `ignoreErrors` in config files
   - Check `beforeSend` function

3. **Check Environment:**
   - Verify `NEXT_PUBLIC_ENVIRONMENT` is set correctly
   - Check Sentry dashboard filters

---

## 📊 Configuration Details

### Sample Rates:

```typescript
// Development
tracesSampleRate: 1.0              // 100% of transactions
replaysSessionSampleRate: 0.5      // 50% of sessions

// Production
tracesSampleRate: 0.1              // 10% of transactions
replaysSessionSampleRate: 0.1      // 10% of sessions
replaysOnErrorSampleRate: 1.0      // 100% of errors
```

### Features Enabled:

- ✅ **Error Tracking** - Client & Server
- ✅ **Performance Monitoring** - Traces & Transactions
- ✅ **Session Replay** - User session recordings
- ✅ **Source Maps** - Readable stack traces
- ✅ **Breadcrumbs** - Event trail before errors
- ✅ **User Context** - User identification
- ✅ **Custom Tags** - Error categorization
- ✅ **HTTP Integration** - API call tracking
- ✅ **Prisma Integration** - Database query tracking
- ✅ **Automatic Instrumentation** - Route tracking

### Integrations:

```typescript
// Client
- replayIntegration()
- browserTracingIntegration()

// Server
- prismaIntegration()
- httpIntegration()
```

---

## 🎯 Best Practices

### 1. **Error Handling in API Routes:**

```typescript
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  try {
    // Your code
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        route: '/api/your-route',
        method: 'GET',
      },
      contexts: {
        request: {
          url: request.url,
          method: request.method,
        },
      },
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 2. **Error Handling in Server Components:**

```typescript
import * as Sentry from '@sentry/nextjs';

export default async function Page() {
  try {
    const data = await fetchData();
    return <div>{data}</div>;
  } catch (error) {
    Sentry.captureException(error);
    throw error; // Will be caught by error.tsx
  }
}
```

### 3. **Custom Events:**

```typescript
import * as Sentry from '@sentry/nextjs';

// Info message
Sentry.captureMessage('User completed onboarding', {
  level: 'info',
  tags: { feature: 'onboarding' },
});

// Warning
Sentry.captureMessage('API rate limit approaching', {
  level: 'warning',
  tags: { api: 'external' },
});
```

### 4. **User Context:**

```typescript
import * as Sentry from '@sentry/nextjs';

// Set user context
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Clear user context (on logout)
Sentry.setUser(null);
```

### 5. **Performance Tracking:**

```typescript
import * as Sentry from '@sentry/nextjs';

const transaction = Sentry.startTransaction({
  name: 'process-payment',
  op: 'payment',
});

try {
  const span1 = transaction.startChild({
    op: 'validate',
    description: 'Validate payment details',
  });
  await validatePayment();
  span1.finish();

  const span2 = transaction.startChild({
    op: 'charge',
    description: 'Charge customer',
  });
  await chargeCustomer();
  span2.finish();
} finally {
  transaction.finish();
}
```

---

## 🔒 Security Considerations

### 1. **Sanitize Sensitive Data:**

Already configured in `beforeSend`:

```typescript
beforeSend(event, hint) {
  // Remove sensitive headers
  if (event.request?.headers) {
    delete event.request.headers['authorization'];
    delete event.request.headers['cookie'];
  }
  return event;
}
```

### 2. **Environment Variables:**

- ✅ Never commit `.env.local` to git
- ✅ Use different DSNs for dev/staging/prod
- ✅ Rotate auth tokens regularly

### 3. **PII (Personally Identifiable Information):**

```typescript
// Mask sensitive data in replays
replaysIntegration({
  maskAllText: true,
  blockAllMedia: true,
})
```

---

## 📈 Monitoring & Alerts

### Set Up Alerts:

1. Go to Sentry → Alerts → Create Alert
2. Choose conditions:
   - New issue created
   - Issue frequency threshold
   - Performance degradation
3. Set notification channels:
   - Email
   - Slack
   - PagerDuty

### Key Metrics to Monitor:

- **Error Rate:** Errors per minute
- **Affected Users:** Unique users experiencing errors
- **APDEX Score:** Application performance index
- **Transaction Duration:** P50, P75, P95, P99
- **Crash-Free Sessions:** Percentage of error-free sessions

---

## 🆘 Support & Resources

### Official Documentation:
- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js 15 Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)

### Common Issues:
- [Sentry GitHub Issues](https://github.com/getsentry/sentry-javascript/issues)
- [Next.js Discussions](https://github.com/vercel/next.js/discussions)

### Get Help:
- Sentry Discord: https://discord.gg/sentry
- Stack Overflow: Tag `sentry` + `next.js`

---

## ✅ Setup Complete!

Your Sentry integration is **production-ready** with:

- ✅ Client-side error tracking
- ✅ Server-side error tracking
- ✅ Edge runtime support
- ✅ Performance monitoring
- ✅ Session replay
- ✅ Source maps
- ✅ Error boundaries
- ✅ API route tracking
- ✅ Testing page
- ✅ Comprehensive documentation

**Next Steps:**
1. Add your Sentry DSN to `.env.local`
2. Visit `/test-sentry` to verify setup
3. Check Sentry dashboard for captured events
4. Deploy to production with environment variables

---

**Happy Monitoring! 🎉**
