# ✅ Sentry Setup Checklist

Use this checklist to verify your Sentry integration is complete and working.

---

## 📋 Pre-Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Next.js 15 project running
- [ ] Sentry account created (https://sentry.io/signup/)
- [ ] Sentry project created (select "Next.js")

---

## 🔧 Configuration Checklist

### Files Created/Updated

- [ ] `sentry.client.config.ts` exists
- [ ] `sentry.server.config.ts` exists
- [ ] `sentry.edge.config.ts` exists
- [ ] `instrumentation.ts` exists
- [ ] `next.config.ts` wrapped with `withSentryConfig`
- [ ] `app/error.tsx` exists
- [ ] `app/global-error.tsx` exists
- [ ] `.env.local` created with Sentry variables

### Environment Variables Set

- [ ] `NEXT_PUBLIC_SENTRY_DSN` (client DSN)
- [ ] `SENTRY_DSN` (server DSN)
- [ ] `SENTRY_AUTH_TOKEN` (for source maps)
- [ ] `SENTRY_ORG` (organization slug)
- [ ] `SENTRY_PROJECT` (project slug)
- [ ] `NEXT_PUBLIC_ENVIRONMENT` (optional)

---

## 🧪 Testing Checklist

### Development Testing

- [ ] Dev server starts without errors
- [ ] No Sentry-related console errors
- [ ] Test page loads: `/test-sentry`
- [ ] "Trigger Client Error" button works
- [ ] Error appears in Sentry dashboard (within 10 seconds)
- [ ] "Test API Error" button works
- [ ] API error appears in Sentry dashboard
- [ ] "Trigger Unhandled Error" shows error boundary
- [ ] "Send Custom Event" creates event in Sentry
- [ ] "Test Performance" creates transaction in Sentry

### Browser Console Checks

- [ ] Open DevTools (F12) → Console
- [ ] See Sentry initialization logs
- [ ] No "Sentry DSN not configured" warning
- [ ] No Sentry-related errors

### Network Tab Checks

- [ ] Open DevTools → Network
- [ ] Filter by "sentry"
- [ ] See requests to Sentry (or tunnel route)
- [ ] Requests return 200 status

---

## 🚀 Build & Production Checklist

### Build Process

- [ ] Run `npm run build`
- [ ] Build completes successfully
- [ ] See "Uploading source maps to Sentry" in logs
- [ ] No Sentry-related build errors
- [ ] Check `.next` folder created

### Source Maps Verification

- [ ] Go to Sentry → Settings → Source Maps
- [ ] See uploaded source maps for latest release
- [ ] Release name matches build
- [ ] Files list shows your source files

### Production Deployment

- [ ] Environment variables added to hosting platform
- [ ] Deployment successful
- [ ] Production site loads without errors
- [ ] Test error in production
- [ ] Error appears in Sentry with correct environment tag
- [ ] Stack trace shows original source code (not minified)

---

## 📊 Sentry Dashboard Checklist

### Issues Tab

- [ ] Can access: `https://sentry.io/organizations/[org]/issues/`
- [ ] See test errors from development
- [ ] Click on error to see details
- [ ] Stack trace is readable (not minified)
- [ ] See file names and line numbers
- [ ] See breadcrumbs (events before error)
- [ ] See user context (if set)
- [ ] See custom tags and context

### Performance Tab

- [ ] Can access: `https://sentry.io/organizations/[org]/performance/`
- [ ] See transactions from test page
- [ ] Click on transaction to see details
- [ ] See spans and timing
- [ ] See route performance metrics

### Replays Tab (if enabled)

- [ ] Can access: `https://sentry.io/organizations/[org]/replays/`
- [ ] See session replays
- [ ] Click on replay to watch
- [ ] See user interactions
- [ ] See console logs

---

## 🔍 Verification Commands

### Check Environment Variables

```bash
# In apps/admin-web directory
echo "Client DSN: $NEXT_PUBLIC_SENTRY_DSN"
echo "Server DSN: $SENTRY_DSN"
echo "Auth Token: ${SENTRY_AUTH_TOKEN:0:10}..." # First 10 chars
echo "Org: $SENTRY_ORG"
echo "Project: $SENTRY_PROJECT"
```

### Check Files Exist

```bash
# In apps/admin-web directory
ls -la sentry.*.ts
ls -la instrumentation.ts
ls -la app/error.tsx
ls -la app/global-error.tsx
ls -la app/test-sentry/page.tsx
```

### Check Package Installed

```bash
# In apps/admin-web directory
npm list @sentry/nextjs
```

### Check Build Logs

```bash
# In apps/admin-web directory
npm run build 2>&1 | grep -i sentry
```

---

## 🐛 Troubleshooting Checklist

### If Errors Not Appearing

- [ ] DSN is set correctly (no typos)
- [ ] DSN starts with `https://`
- [ ] Sample rate is not 0
- [ ] Error is not in `ignoreErrors` list
- [ ] `beforeSend` is not filtering out error
- [ ] Sentry dashboard filters are not hiding error
- [ ] Wait 10-30 seconds for error to appear

### If Source Maps Not Working

- [ ] Auth token is set
- [ ] Auth token has correct scopes (`project:releases`, `project:write`)
- [ ] Org and project slugs are correct
- [ ] Build completed successfully
- [ ] Check Sentry → Settings → Source Maps

### If Performance Data Missing

- [ ] `tracesSampleRate` is > 0
- [ ] `enableTracing: true` in config
- [ ] Performance tab enabled in Sentry project settings
- [ ] Wait a few minutes for data to appear

### If Build Fails

- [ ] `@sentry/nextjs` is installed
- [ ] `next.config.ts` syntax is correct
- [ ] All Sentry config files exist
- [ ] No TypeScript errors in config files

---

## 📝 Documentation Checklist

- [ ] Read `SENTRY_QUICK_START.md`
- [ ] Read `SENTRY_SETUP.md`
- [ ] Bookmark `SENTRY_EXAMPLES.md` for reference
- [ ] Share documentation with team

---

## 🎯 Production Readiness Checklist

### Security

- [ ] `.env.local` is in `.gitignore`
- [ ] Auth token is not committed to git
- [ ] Sensitive headers are filtered
- [ ] PII masking is enabled in replays
- [ ] Different DSNs for dev/staging/prod (recommended)

### Performance

- [ ] Sample rates configured appropriately
  - [ ] Production: `tracesSampleRate: 0.1` (10%)
  - [ ] Production: `replaysSessionSampleRate: 0.1` (10%)
  - [ ] Development: `tracesSampleRate: 1.0` (100%)
- [ ] Source maps hidden in production
- [ ] Logger statements tree-shaken

### Monitoring

- [ ] Alerts configured in Sentry
- [ ] Team members added to Sentry project
- [ ] Notification channels set up (email, Slack, etc.)
- [ ] Error assignment rules configured

### Documentation

- [ ] Team knows how to access Sentry dashboard
- [ ] Team knows how to use Sentry in code
- [ ] Runbook created for common issues
- [ ] On-call process includes Sentry alerts

---

## ✅ Final Verification

### Quick Test (5 minutes)

1. [ ] Start dev server: `npm run dev`
2. [ ] Visit: `http://localhost:3000/test-sentry`
3. [ ] Click "Trigger Client Error"
4. [ ] Go to Sentry dashboard
5. [ ] See error appear within 10 seconds
6. [ ] Click on error
7. [ ] Verify stack trace is readable
8. [ ] Verify file names and line numbers are correct

### Production Test (10 minutes)

1. [ ] Deploy to production
2. [ ] Visit production site
3. [ ] Trigger a test error
4. [ ] Check Sentry dashboard
5. [ ] Verify error appears with `environment: production`
6. [ ] Verify source maps work (readable stack trace)
7. [ ] Check performance data
8. [ ] Verify session replay (if enabled)

---

## 🎉 Completion

When all items are checked:

- ✅ Sentry is fully configured
- ✅ Error tracking is working
- ✅ Performance monitoring is active
- ✅ Source maps are uploading
- ✅ Production deployment is ready

---

## 📞 Support

If you encounter issues:

1. Check `SENTRY_SETUP.md` troubleshooting section
2. Review `SENTRY_EXAMPLES.md` for usage patterns
3. Visit Sentry docs: https://docs.sentry.io
4. Join Sentry Discord: https://discord.gg/sentry
5. Check GitHub issues: https://github.com/getsentry/sentry-javascript

---

**Setup Complete! 🚀**

Print this checklist and check off items as you complete them.
