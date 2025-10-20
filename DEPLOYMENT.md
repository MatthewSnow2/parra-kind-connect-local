# Deployment Guide

## Environment Variables Setup

### Local Development (.env file)

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_PROJECT_ID="xoygyimwkmepwjqmnfxh"
VITE_SUPABASE_URL="https://xoygyimwkmepwjqmnfxh.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhveWd5aW13a21lcHdqcW1uZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODg1MjIsImV4cCI6MjA3NTc2NDUyMn0.3u1Z1NuiMA0SGe5GJsCc1Hv0cyBtnDuqunpRo8l2A54"
VITE_REALTIME_PROXY_URL="wss://parra-connect-voice.onrender.com"
```

**IMPORTANT**: This file is in `.gitignore` and will NEVER be committed to Git.

---

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI** (if not already):
   ```bash
   npm i -g vercel
   ```

2. **Set Environment Variables**:
   ```bash
   vercel env add VITE_SUPABASE_PROJECT_ID
   # Enter: xoygyimwkmepwjqmnfxh

   vercel env add VITE_SUPABASE_URL
   # Enter: https://xoygyimwkmepwjqmnfxh.supabase.co

   vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
   # Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhveWd5aW13a21lcHdqcW1uZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODg1MjIsImV4cCI6MjA3NTc2NDUyMn0.3u1Z1NuiMA0SGe5GJsCc1Hv0cyBtnDuqunpRo8l2A54

   vercel env add VITE_REALTIME_PROXY_URL
   # Enter: wss://parra-connect-voice.onrender.com
   ```

3. **Or via Vercel Dashboard**:
   - Go to: https://vercel.com/your-project/settings/environment-variables
   - Add each variable:
     - Name: `VITE_SUPABASE_PROJECT_ID`
     - Value: `xoygyimwkmepwjqmnfxh`
   - Repeat for all 4 variables
   - Click "Save"

4. **Deploy**:
   ```bash
   vercel --prod
   ```

---

### Option 2: Netlify

1. **Via Netlify Dashboard**:
   - Go to: Site Settings → Build & Deploy → Environment
   - Click "Add variable"
   - Add each variable:
     - `VITE_SUPABASE_PROJECT_ID` = `xoygyimwkmepwjqmnfxh`
     - `VITE_SUPABASE_URL` = `https://xoygyimwkmepwjqmnfxh.supabase.co`
     - `VITE_SUPABASE_PUBLISHABLE_KEY` = `eyJhbGci...`
     - `VITE_REALTIME_PROXY_URL` = `wss://parra-connect-voice.onrender.com`

2. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

---

### Option 3: GitHub Pages + Supabase Hosting

**Not recommended** - GitHub Pages doesn't support environment variables at build time.

Use Vercel or Netlify instead.

---

## How It Works

### Build Process
1. **Local**: Vite reads `.env` file
2. **Production**: Platform injects environment variables during build
3. **Both**: Variables with `VITE_` prefix are embedded in bundle

### Security
- ✅ `.env` file never committed (in `.gitignore`)
- ✅ These are **public/anonymous keys** (safe to expose in frontend)
- ✅ Service role keys stay in Supabase Edge Functions (server-side only)

---

## Troubleshooting

### "Cannot read properties of undefined (reading 'supabase')"

**Cause**: Environment variables not loaded

**Fix**:
1. Check `.env` file exists locally
2. Check Vercel/Netlify environment variables are set
3. Redeploy after adding variables

### Variables Not Updating

**Vercel**:
```bash
vercel env pull  # Download env vars
vercel --prod    # Redeploy
```

**Netlify**:
```bash
netlify deploy --prod --clear-cache
```

---

## Current Deployment

**Platform**: Vercel (assumed)
**URL**: TBD after environment variables set

**Next Steps**:
1. ✅ `.env` created locally (not committed)
2. ⏳ Set environment variables in Vercel/Netlify
3. ⏳ Redeploy
4. ✅ Site will work again!
