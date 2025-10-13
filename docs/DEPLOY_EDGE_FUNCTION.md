# Deploy Edge Function - Step by Step Guide

## The Problem

You're getting **"Failed to fetch"** error because the `senior-chat` edge function is **not deployed** to Supabase yet.

- ✅ The function code exists locally in `/supabase/functions/senior-chat/`
- ❌ It's not deployed to your Supabase project yet
- ℹ️ Netlify only deploys your frontend (React app), not backend edge functions

---

## Solution: Deploy to Supabase

You have **2 options** to deploy:

### Option 1: Via Supabase CLI (Recommended - Faster)

**Step 1: Install Supabase CLI (if not already installed)**

```bash
# On macOS
brew install supabase/tap/supabase

# On Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# On Linux
brew install supabase/tap/supabase
```

Or install via npm (works everywhere):
```bash
npm install -g supabase
```

**Step 2: Login to Supabase**

```bash
supabase login
```

This will open a browser window to authenticate. Follow the prompts.

**Step 3: Deploy the Function**

```bash
# Navigate to your project directory
cd /workspace/para-kind-connect-local

# Deploy the senior-chat function
supabase functions deploy senior-chat --project-ref xoygyimwkmepwjqmnfxh
```

**Expected Output:**
```
Deploying Function (project-ref: xoygyimwkmepwjqmnfxh)...
  version: ...
  entrypoint: file:///workspace/.../index.ts
Deployed Function senior-chat.
  url: https://xoygyimwkmepwjqmnfxh.supabase.co/functions/v1/senior-chat
```

✅ **Done!** The function is now deployed.

---

### Option 2: Via Supabase Dashboard (Manual - Slower)

Unfortunately, you **cannot** deploy edge functions directly via the dashboard UI. You must use the CLI or API.

However, you can **verify** it's deployed:

1. Go to https://supabase.com/dashboard
2. Select project `xoygyimwkmepwjqmnfxh`
3. Click **Edge Functions** in sidebar
4. You should see `senior-chat` listed

---

## After Deployment

### 1. Test the Function

Run the test page again:
```
open /workspace/para-kind-connect-local/test-chat-function.html
```

Or test via command line:
```bash
curl -i --location --request POST \
  'https://xoygyimwkmepwjqmnfxh.supabase.co/functions/v1/senior-chat' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhveWd5aW13a21lcHdqcW1uZnhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODg1MjIsImV4cCI6MjA3NTc2NDUyMn0.3u1Z1NuiMA0SGe5GJsCc1Hv0cyBtnDuqunpRo8l2A54' \
  --header 'Content-Type: application/json' \
  --data '{"messages":[{"role":"user","content":"Hello"}]}'
```

### 2. If You Get "OPENAI_API_KEY is not configured"

Good news! This means the function is deployed and working, but the API key isn't set.

**Set the secret:**

Via CLI:
```bash
supabase secrets set OPENAI_API_KEY=sk-your-actual-openai-key-here --project-ref xoygyimwkmepwjqmnfxh
```

Via Dashboard:
1. Go to Project Settings → Edge Functions
2. Under Secrets, add:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (starts with `sk-...`)
3. Click Save

**Then redeploy to pick up the secret:**
```bash
supabase functions deploy senior-chat --project-ref xoygyimwkmepwjqmnfxh
```

### 3. Test Chat in Your App

Go to your deployed site:
```
https://your-netlify-site.netlify.app/senior/chat
```

Or locally:
```
http://localhost:8081/senior/chat
```

Try sending a message - it should work now!

---

## Troubleshooting

### "supabase: command not found"

Install the CLI:
```bash
npm install -g supabase
```

### "Access token not provided"

Login first:
```bash
supabase login
```

### "Permission denied" or "403"

Your OpenAI API key might be read-only. Create a new key with full permissions at https://platform.openai.com/api-keys

### "Rate limit exceeded" (429)

Your OpenAI account hit the rate limit. Wait a moment and try again.

### "Invalid API key" (401)

The OpenAI API key is wrong or expired. Generate a new one.

### Still Getting "Failed to fetch"

1. Check if function is deployed:
   ```bash
   supabase functions list --project-ref xoygyimwkmepwjqmnfxh
   ```

2. Check edge function logs:
   ```bash
   supabase functions logs senior-chat --project-ref xoygyimwkmepwjqmnfxh
   ```

3. Verify your `.env` file has the correct `VITE_SUPABASE_URL`

---

## Quick Commands Summary

```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Deploy function
supabase functions deploy senior-chat --project-ref xoygyimwkmepwjqmnfxh

# Set OpenAI key
supabase secrets set OPENAI_API_KEY=sk-... --project-ref xoygyimwkmepwjqmnfxh

# View logs
supabase functions logs senior-chat --project-ref xoygyimwkmepwjqmnfxh

# List functions
supabase functions list --project-ref xoygyimwkmepwjqmnfxh
```

---

## Alternative: Use Supabase Management API

If you can't use the CLI, you can deploy via API:

```bash
# Get your access token from Supabase dashboard
# Settings → API → Project API keys → service_role key

curl -i --location --request POST \
  'https://api.supabase.com/v1/projects/xoygyimwkmepwjqmnfxh/functions/senior-chat/deploy' \
  --header 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "entrypoint_path": "index.ts",
    "verify_jwt": true
  }'
```

But the CLI is much easier!

---

## Need Help?

1. Make sure you're running commands from `/workspace/para-kind-connect-local`
2. Check you have Node.js and npm installed
3. Verify you have internet connection
4. Try running with `--debug` flag for more details:
   ```bash
   supabase functions deploy senior-chat --project-ref xoygyimwkmepwjqmnfxh --debug
   ```

Once deployed, the chat will work immediately! 🎉
