# ⚡ Sentry Quick Start - 5 Minutes Setup

## 🚀 Quick Setup (3 Steps)

### 1️⃣ Get Sentry Credentials

Visit: https://sentry.io/signup/

1. Create account → Create project (Next.js)
2. Copy your **DSN** (looks like: `https://xxx@oXXX.ingest.sentry.io/XXX`)
3. Get **Auth Token**: Settings → Account → API → Auth Tokens → Create Token
   - Scopes: `project:releases`, `project:write`
4. Note your **Org Slug** and **Project Slug** from URL

### 2️⃣ Configure Environment

Create `apps/admin-web/.env.local`:

```env
NEXT_PUBLIC_SENTRY_DSN=https://your-key@oXXX.ingest.sentry.io/XXX
SENTRY_DSN=https://your-key@oXXX.ingest.sentry.io/XXX
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
NEXT_PUBLIC_ENVIRONMENT=development
```

### 3️⃣ Test It

```bash
cd apps/admin-web
npm run dev
```

Visit: http://localhost:3000/test-sentry

Click "Trigger Client Error" → Check Sentry dashboard

---

## ✅ Verification Checklist

- [ ] DSN added to `.env.local`
- [ ] Dev server running without errors
- [ ] Test page loads at `/test-sentry`
- [ ] Error appears in Sentry dashboard (within 10 seconds)
- [ ] Source maps visible in stack trace

---

## 🧪 Quick Tests

### Test 1: Client Error
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(new Error('Test error'));
```

### Test 2: Server Error (API Route)
```typescript
// app/api/test/route.ts
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    throw new Error('API error');
  } catch (error) {
    Sentry.captureException(error);
    return Response.json({ error: 'Error' }, { status: 500 });
  }
}
```

### Test 3: Error Boundary
```typescript
// Any client component
'use client';

export default function Page() {
  throw new Error('Unhandled error'); // Caught by error.tsx
}
```

---

## 📊 What's Configured

✅ **Files Created:**
- `sentry.client.config.ts` - Browser tracking
- `sentry.server.config.ts` - Server tracking
- `sentry.edge.config.ts` - Edge runtime
- `instrumentation.ts` - Next.js 15 bootstrap
- `app/error.tsx` - Error boundary
- `app/global-error.tsx` - Global fallback
- `app/test-sentry/page.tsx` - Testing page
- `app/api/test-sentry/route.ts` - API example

✅ **Features Enabled:**
- Error tracking (client + server)
- Performance monitoring
- Session replay
- Source maps
- User context
- Breadcrumbs
- Custom tags

✅ **Sample Rates:**
- Development: 100% traces, 50% replays
- Production: 10% traces, 10% replays, 100% errors

---

## 🚨 Troubleshooting

### Errors not appearing?

1. **Check DSN:**
   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. **Check console:**
   - Open DevTools (F12)
   - Look for Sentry initialization logs

3. **Check network:**
   - DevTools → Network → Filter "sentry"
   - Should see requests to Sentry

### Source maps not working?

1. **Check auth token:**
   ```bash
   echo $SENTRY_AUTH_TOKEN
   ```

2. **Check build logs:**
   ```bash
   npm run build | grep -i sentry
   ```

3. **Verify org/project:**
   - Check `SENTRY_ORG` and `SENTRY_PROJECT` match dashboard

---

## 🎯 Common Use Cases

### Catch API Errors
```typescript
try {
  const response = await fetch('/api/data');
  if (!response.ok) throw new Error('API failed');
} catch (error) {
  Sentry.captureException(error, {
    tags: { api: 'data' },
  });
}
```

### Track User Actions
```typescript
Sentry.captureMessage('User completed checkout', {
  level: 'info',
  tags: { feature: 'checkout' },
});
```

### Set User Context
```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
});
```

### Performance Tracking
```typescript
const transaction = Sentry.startTransaction({
  name: 'load-dashboard',
  op: 'pageload',
});

// ... do work ...

transaction.finish();
```

---

## 🚀 Production Deployment

### Vercel:
1. Add environment variables in Vercel dashboard
2. Deploy: `git push`
3. Verify source maps in Sentry

### Other Platforms:
Add same environment variables to your hosting config

---

## 📚 Full Documentation

See `SENTRY_SETUP.md` for complete guide

---

## 🎉 You're Done!

Sentry is now tracking errors in your Next.js 15 app!

**Next:** Visit `/test-sentry` to verify everything works
