# Quick Setup Guide - Para Connect Security

This guide helps you quickly set up the Para Connect application with the new security improvements.

---

## For New Developers

### Step 1: Clone and Install
```bash
git clone <your-repo-url>
cd para-kind-connect-local
npm install
```

### Step 2: Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# Get these from: https://app.supabase.com/project/_/settings/api
nano .env.local
```

**Required values in `.env.local`**:
```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-public-key"
```

### Step 3: Verify Setup
```bash
# Run the app
npm run dev

# If environment variables are invalid, you'll see a clear error:
# ❌ Environment variable validation failed:
#   - VITE_SUPABASE_URL: Supabase URL must be a valid URL

# If successful:
# ✓ Environment validated successfully
# ➜ Local: http://localhost:5173/
```

### Step 4: Important Security Rules

#### ❌ NEVER commit these files:
- `.env` - Contains sensitive values
- `.env.local` - Contains sensitive values
- `.env.production` - Contains production secrets

#### ✅ ALWAYS commit these files:
- `.env.example` - Template with placeholders
- `.gitignore` - Protects sensitive files

#### ✅ ALWAYS use validated env config:
```typescript
// ❌ Bad
const url = import.meta.env.VITE_SUPABASE_URL;

// ✅ Good
import { env } from '@/config/env';
const url = env.VITE_SUPABASE_URL;
```

#### ✅ ALWAYS use secure API wrapper:
```typescript
// ❌ Bad - Direct Bearer token exposure
fetch(url, {
  headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` }
});

// ✅ Good - Secure wrapper
import { callSupabaseFunctionStreaming } from '@/lib/supabase-functions';
const resp = await callSupabaseFunctionStreaming({
  functionName: "senior-chat",
  body: { messages }
});
```

---

## For Existing Developers

### Update Your Local Setup

#### 1. Pull Latest Changes
```bash
git pull origin main
```

#### 2. Create .env.local
```bash
# Copy your existing .env values to .env.local
cp .env .env.local

# The .env file is now for documentation only
# Real values should be in .env.local
```

#### 3. Update Import Statements
Search for any direct `import.meta.env` usage and replace:

```typescript
// Find and replace in your editor:
// Find: import.meta.env.VITE_SUPABASE_URL
// Replace with import from validated config

import { env } from '@/config/env';
const url = env.VITE_SUPABASE_URL;
```

#### 4. Update API Calls
Replace direct fetch calls to Supabase Functions:

```typescript
// Old code:
const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/my-function`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
  },
  body: JSON.stringify(data),
});

// New code:
import { callSupabaseFunction } from '@/lib/supabase-functions';

const result = await callSupabaseFunction({
  functionName: 'my-function',
  body: data,
});
```

#### 5. Test Your Changes
```bash
npm run dev
# Verify the app starts without errors
# Test your features still work
```

---

## For DevOps/Deployment

### Netlify Deployment

#### 1. Set Environment Variables
```bash
# Via Netlify CLI
netlify env:set VITE_SUPABASE_PROJECT_ID "your-project-id"
netlify env:set VITE_SUPABASE_URL "https://your-project.supabase.co"
netlify env:set VITE_SUPABASE_PUBLISHABLE_KEY "your-key"

# Or via Netlify Dashboard:
# Site settings > Build & deploy > Environment > Environment variables
```

#### 2. Add Security Headers
Create `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; connect-src 'self' https://*.supabase.co"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
```

### Vercel Deployment

#### 1. Set Environment Variables
```bash
# Via Vercel CLI
vercel env add VITE_SUPABASE_PROJECT_ID production
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production

# Or via Vercel Dashboard:
# Project settings > Environment Variables
```

#### 2. Add Security Headers
Create `vercel.json`:
```json
{
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
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

### GitHub Actions CI/CD

Add environment variables as secrets:
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run security audit
        run: npm audit --audit-level=moderate

      - name: Build
        env:
          VITE_SUPABASE_PROJECT_ID: ${{ secrets.VITE_SUPABASE_PROJECT_ID }}
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
        run: npm run build

      - name: Deploy
        # Your deployment step here
```

---

## Troubleshooting

### Error: "Environment variable validation failed"
**Problem**: Missing or invalid environment variables.

**Solution**:
```bash
# Check your .env.local file exists
ls -la .env.local

# Verify it has all required variables
cat .env.local

# Compare with .env.example
diff .env.local .env.example

# Make sure values are properly formatted:
# - URLs must start with https://
# - Keys should be valid (JWT format for Supabase)
# - No trailing spaces or quotes issues
```

### Error: "Module not found: @/config/env"
**Problem**: TypeScript path alias not configured.

**Solution**: Check `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Error: "Cannot find module 'zod'"
**Problem**: Dependencies not installed.

**Solution**:
```bash
npm install
# Zod should already be in package.json
```

### Build fails in production
**Problem**: Environment variables not set in hosting platform.

**Solution**:
- Check your hosting dashboard (Netlify, Vercel, etc.)
- Verify all `VITE_*` environment variables are set
- Rebuild after setting variables

### Git shows .env.local as untracked
**Status**: ✅ This is correct!

`.env.local` should NOT be committed. It will always show as untracked. This is intentional and secure.

---

## Security Checklist for Developers

Before committing code:
- [ ] No hardcoded secrets or API keys
- [ ] No `import.meta.env` used directly (use `env` from `@/config/env`)
- [ ] No Bearer tokens in fetch headers (use secure API wrapper)
- [ ] All environment variables validated with Zod
- [ ] .env.local not committed (check `git status`)
- [ ] Sensitive data not logged to console

Before deploying:
- [ ] All environment variables set in hosting platform
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Dependencies up to date (`npm audit`)
- [ ] Build succeeds with production env vars
- [ ] Row-Level Security enabled in Supabase

---

## Next Steps

After setup, review:
1. **Security Checklist** (`SECURITY_CHECKLIST.md`) - Comprehensive security guide
2. **Audit Report** (`SECURITY_AUDIT_REPORT.md`) - Detailed findings and fixes
3. **Improvements Summary** (`SECURITY_IMPROVEMENTS_SUMMARY.md`) - Quick overview

---

## Need Help?

### Documentation
- **This Guide**: Quick setup instructions
- **SECURITY_CHECKLIST.md**: Comprehensive security practices
- **SECURITY_AUDIT_REPORT.md**: Detailed audit findings
- **SECURITY_IMPROVEMENTS_SUMMARY.md**: Overview of changes

### Code Examples
- **src/config/env.ts**: Environment validation
- **src/lib/supabase-functions.ts**: Secure API wrapper
- **.env.example**: Environment template

### External Resources
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Zod Documentation](https://zod.dev)

---

**Last Updated**: October 12, 2025
