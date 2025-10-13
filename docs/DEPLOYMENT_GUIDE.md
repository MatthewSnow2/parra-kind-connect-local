# Para Connect - Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Edge Functions Deployment](#edge-functions-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Rollback Procedures](#rollback-procedures)
10. [Troubleshooting](#troubleshooting)

---

## Overview

Para Connect can be deployed to various platforms. This guide covers:
- **Netlify** (Recommended for static site hosting)
- **Vercel** (Alternative with excellent DX)
- **Supabase** (Backend and Edge Functions)

### Architecture

```
┌──────────────────────────────────────────────┐
│  Frontend (React SPA)                        │
│  Hosted on: Netlify/Vercel                   │
│  CDN: Global distribution                    │
└──────────────────────────────────────────────┘
                    ↓ HTTPS
┌──────────────────────────────────────────────┐
│  Supabase (Backend)                          │
│  - PostgreSQL Database                       │
│  - Authentication (JWT)                      │
│  - Edge Functions (Deno)                     │
│  - Row-Level Security                        │
└──────────────────────────────────────────────┘
                    ↓ HTTPS
┌──────────────────────────────────────────────┐
│  External Services                           │
│  - OpenAI API (GPT-4o-mini)                  │
│  - Email (Supabase SMTP)                     │
└──────────────────────────────────────────────┘
```

---

## Pre-Deployment Checklist

### Code Readiness
- [ ] All tests passing (`npm test`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Production build succeeds (`npm run build`)
- [ ] No console.log statements in production code
- [ ] Environment variables documented in `.env.example`

### Security Readiness
- [ ] All API keys secured (not in code)
- [ ] Row-Level Security policies deployed
- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] Security headers configured

### Database Readiness
- [ ] Migrations applied and tested
- [ ] RLS policies enabled on all tables
- [ ] Indexes created for performance
- [ ] Backup strategy defined

### Performance Readiness
- [ ] Lighthouse score > 90
- [ ] Bundle size analyzed
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Caching strategy defined

---

## Environment Configuration

### Development Environment

```bash
# .env.local (local development)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### Staging Environment

```bash
# Staging configuration (set in hosting platform)
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=staging-project-id
VITE_ENVIRONMENT=staging
```

### Production Environment

```bash
# Production configuration (set in hosting platform)
VITE_SUPABASE_URL=https://production-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=production-project-id
VITE_ENVIRONMENT=production
```

### Edge Function Environment Variables

Set in Supabase Dashboard:

```bash
# Supabase Dashboard > Edge Functions > Settings
OPENAI_API_KEY=sk-...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Database Setup

### 1. Create Supabase Project

```bash
# Via Supabase Dashboard
1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details:
   - Name: para-connect-production
   - Database Password: (generate strong password)
   - Region: (closest to your users)
4. Wait for project to be provisioned (~2 minutes)
```

### 2. Apply Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push

# Verify migrations
supabase db diff
```

### 3. Enable Row-Level Security

RLS policies are included in migrations, but verify:

```sql
-- Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- All tables should show rowsecurity = true
```

### 4. Configure Authentication

```bash
# In Supabase Dashboard > Authentication > Settings

# Email Auth Settings:
✅ Enable Email Provider
✅ Confirm Email: Enabled (recommended for production)
✅ Double Confirm Email: Disabled

# Email Templates:
# Customize confirmation, password reset emails
# Use your domain in email templates

# Site URL:
https://your-domain.com

# Redirect URLs:
https://your-domain.com/**
```

### 5. Create Database Backup

```bash
# In Supabase Dashboard > Database > Backups
# Enable Point-in-Time Recovery (PITR)
# Schedule daily backups
```

---

## Edge Functions Deployment

### 1. Deploy senior-chat Function

```bash
# Navigate to project root
cd /workspace/para-kind-connect-local

# Deploy function
supabase functions deploy senior-chat

# Verify deployment
supabase functions list
```

### 2. Set Function Secrets

```bash
# Set OpenAI API key
supabase secrets set OPENAI_API_KEY=sk-...

# Verify secrets
supabase secrets list
```

### 3. Test Function

```bash
# Test deployed function
curl -i --location --request POST 'https://your-project.supabase.co/functions/v1/senior-chat' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"messages":[{"role":"user","content":"Hello"}]}'
```

---

## Frontend Deployment

### Option 1: Netlify (Recommended)

#### Setup via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Follow prompts:
# - Create & configure a new site
# - Build command: npm run build
# - Publish directory: dist
```

#### Configure Environment Variables

```bash
# Set environment variables
netlify env:set VITE_SUPABASE_URL "https://your-project.supabase.co"
netlify env:set VITE_SUPABASE_PUBLISHABLE_KEY "your-anon-key"
netlify env:set VITE_SUPABASE_PROJECT_ID "your-project-id"

# Verify
netlify env:list
```

#### Deploy

```bash
# Deploy to production
netlify deploy --prod

# Or configure continuous deployment from Git
netlify link
```

#### Configure Security Headers

Create `netlify.toml` in project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    # Security headers
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"

    # CSP - Adjust based on your needs
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval';
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https:;
      connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com;
      frame-ancestors 'none';
    """

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Redirect www to non-www (or vice versa)
[[redirects]]
  from = "https://www.your-domain.com/*"
  to = "https://your-domain.com/:splat"
  status = 301
  force = true
```

### Option 2: Vercel

#### Setup via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts to link or create project
```

#### Configure Environment Variables

```bash
# Add environment variables
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
vercel env add VITE_SUPABASE_PROJECT_ID production

# Deploy to production
vercel --prod
```

#### Configure Security Headers

Create `vercel.json` in project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## Post-Deployment Verification

### 1. Functional Testing

```bash
# Checklist
- [ ] Homepage loads correctly
- [ ] User can sign up
- [ ] User can sign in
- [ ] Protected routes redirect to login
- [ ] Senior chat works
- [ ] Caregiver dashboard loads
- [ ] Alerts display correctly
- [ ] Database queries work
- [ ] Edge functions respond
```

### 2. Performance Testing

```bash
# Run Lighthouse audit
npx lighthouse https://your-domain.com --view

# Target scores:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90
```

### 3. Security Testing

```bash
# Check security headers
curl -I https://your-domain.com

# Should see:
# - X-Frame-Options: DENY
# - X-Content-Type-Options: nosniff
# - Strict-Transport-Security: max-age=31536000

# Test authentication
# - Try accessing protected routes without auth
# - Should redirect to login

# Test RLS policies
# - Try accessing another user's data
# - Should fail with permission error
```

### 4. Accessibility Testing

```bash
# Run axe DevTools in browser
# Should have 0 critical violations

# Test keyboard navigation
# All interactive elements should be accessible via keyboard

# Test screen reader (NVDA/JAWS/VoiceOver)
# All content should be announced correctly
```

---

## Monitoring & Maintenance

### Application Monitoring

#### Sentry Setup (Recommended)

```bash
# Install Sentry
npm install @sentry/react @sentry/vite-plugin

# Configure in src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.VITE_ENVIRONMENT || "production",
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

#### Performance Monitoring

```typescript
// Use built-in performance monitor
import { initPerformanceMonitoring } from '@/utils/performance-monitor';

initPerformanceMonitoring({
  reportToAnalytics: true,
  sampleRate: 1.0 // 100% in production
});
```

### Database Monitoring

```bash
# In Supabase Dashboard > Database > Monitoring
- Monitor query performance
- Check connection pool usage
- Review slow queries
- Set up alerts for high CPU/memory
```

### Uptime Monitoring

Use services like:
- **UptimeRobot** (free tier available)
- **Pingdom**
- **StatusCake**

Monitor:
- Homepage availability
- API endpoint health
- Database connectivity

---

## Rollback Procedures

### Frontend Rollback

#### Netlify
```bash
# Via Netlify Dashboard
1. Go to Deploys
2. Find previous successful deploy
3. Click "Publish deploy"

# Via CLI
netlify rollback
```

#### Vercel
```bash
# Via Vercel Dashboard
1. Go to Deployments
2. Find previous deployment
3. Click "Promote to Production"

# Via CLI
vercel rollback
```

### Database Rollback

```bash
# Create migration to reverse changes
supabase migration new rollback_feature_name

# Write SQL to undo changes
# Apply migration
supabase db push

# Or restore from backup (last resort)
# In Supabase Dashboard > Database > Backups
# Select backup and restore
```

### Edge Function Rollback

```bash
# Redeploy previous version
git checkout <previous-commit>
supabase functions deploy senior-chat
git checkout main
```

---

## Troubleshooting

### Build Fails

**Problem**: Build fails with module not found error

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Working

**Problem**: App can't connect to Supabase

**Solution**:
```bash
# Verify environment variables are set
netlify env:list  # or vercel env ls

# Check variable names (must start with VITE_)
# Rebuild after setting variables
netlify build  # or vercel build
```

### Database Connection Issues

**Problem**: Database queries fail

**Solution**:
```sql
-- Check connection limit
SELECT * FROM pg_stat_activity;

-- If too many connections, restart pooler
-- In Supabase Dashboard > Database > Connection Pooling
```

### Edge Function Errors

**Problem**: 500 errors from Edge Function

**Solution**:
```bash
# Check logs
supabase functions logs senior-chat

# Common issues:
# - Missing OPENAI_API_KEY secret
# - Invalid API key
# - Rate limit exceeded

# Fix and redeploy
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy senior-chat
```

### SSL Certificate Issues

**Problem**: HTTPS not working

**Solution**:
```bash
# Netlify: Auto HTTPS, check custom domain settings
# Vercel: Auto HTTPS, verify domain configuration

# If using custom domain:
# 1. Verify DNS records
# 2. Wait for certificate provisioning (5-60 minutes)
# 3. Check hosting dashboard for certificate status
```

---

## CI/CD Setup (GitHub Actions)

### Complete Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Security audit
        run: npm audit --audit-level=moderate

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
          VITE_SUPABASE_PROJECT_ID: ${{ secrets.VITE_SUPABASE_PROJECT_ID }}
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
          path: dist

      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2
        with:
          publish-dir: './dist'
          production-deploy: true
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## Production Checklist

### Before Go-Live
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance optimized (Lighthouse > 90)
- [ ] Accessibility compliant (WCAG 2.1 AA)
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Email templates customized
- [ ] Error tracking set up (Sentry)
- [ ] Uptime monitoring configured
- [ ] Database backups enabled
- [ ] Security headers configured
- [ ] Rate limiting tested
- [ ] Load testing performed
- [ ] Documentation complete

### Post Go-Live (First 24 Hours)
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify user signups work
- [ ] Test critical user flows
- [ ] Monitor database performance
- [ ] Check Edge Function logs
- [ ] Verify email delivery
- [ ] Monitor server costs

---

## Additional Resources

- **Netlify Documentation**: https://docs.netlify.com/
- **Vercel Documentation**: https://vercel.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **GitHub Actions**: https://docs.github.com/en/actions

---

**Document Version**: 1.0.0
**Last Updated**: October 12, 2025
**Maintained By**: Para Connect Development Team
