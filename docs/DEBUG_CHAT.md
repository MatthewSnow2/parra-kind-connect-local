# Chat Debugging Steps

## Quick Diagnostic Checklist

Run through these checks in order:

### 1. Check if Edge Function is Deployed

**Via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select project `xoygyimwkmepwjqmnfxh`
3. Click **Edge Functions** in the left sidebar
4. Look for `senior-chat` in the list

**Expected:** You should see `senior-chat` listed with a green "Deployed" status

❓ **Is it there?**
- ✅ YES → Continue to step 2
- ❌ NO → Need to deploy it first (see below)

### 2. Check Browser Console Error

**Open Browser DevTools:**
1. Press F12 (or Cmd+Option+I on Mac)
2. Go to **Console** tab
3. Try sending a chat message
4. Look for errors

**Common errors you might see:**

```
Failed to fetch
```
→ Edge function not deployed or wrong URL

```
OPENAI_API_KEY is not configured
```
→ Secret not set in Supabase

```
403 Forbidden
```
→ Read-only API key

```
404 Not Found
```
→ Edge function doesn't exist or wrong path

**What error do you see?** Copy it exactly.

### 3. Check Network Tab

**In Browser DevTools:**
1. Go to **Network** tab
2. Send a chat message
3. Look for a request to `senior-chat`
4. Click on it
5. Check the **Status Code**

**Status codes:**
- `200` → Success (but might fail later in stream)
- `404` → Function not found
- `500` → Server error
- `403` → Permission denied

### 4. View Edge Function Logs

**Via Supabase Dashboard:**
1. Go to Edge Functions → senior-chat
2. Click **Logs** tab
3. Send a test message from the chat
4. Watch for real-time logs

**Look for:**
- "Calling OpenAI with messages" → Good, function is running
- "OPENAI_API_KEY is not configured" → Secret missing
- "AI gateway error: 401" → Invalid API key
- "AI gateway error: 403" → Read-only key or quota issue

---

## Deploy Edge Function (If Not Deployed)

You mentioned redeploying from Netlify - **important note:** Netlify hosts your frontend, but edge functions need to be deployed to **Supabase**, not Netlify.

### Deploy to Supabase:

**Option A: Via Supabase Dashboard** (Easier)

Unfortunately, you can't deploy via the dashboard directly. You need the CLI.

**Option B: Via CLI**

```bash
# Navigate to project
cd /workspace/para-kind-connect-local

# Deploy the function
npx supabase functions deploy senior-chat --project-ref xoygyimwkmepwjqmnfxh
```

**If you get "Access token not provided":**

```bash
# Login first
npx supabase login

# Then deploy
npx supabase functions deploy senior-chat --project-ref xoygyimwkmepwjqmnfxh
```

---

## Test the Edge Function Directly

Once deployed, test it directly (bypassing your frontend):

```bash
# Replace YOUR_SUPABASE_ANON_KEY with your actual anon key from .env
curl -i --location --request POST \
  'https://xoygyimwkmepwjqmnfxh.supabase.co/functions/v1/senior-chat' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"messages":[{"role":"user","content":"Hello"}]}'
```

**Expected response:**
- Streaming data starting with `data: {"choices":[...`
- Ends with `data: [DONE]`

**Error responses tell you what's wrong:**
- `404` → Function not deployed
- `OPENAI_API_KEY is not configured` → Secret not set
- `401` → Invalid API key
- `403` → Read-only key or no permissions

---

## Common Issues

### Issue: "Function not found" (404)

**Cause:** Edge function isn't deployed to Supabase

**Fix:**
```bash
npx supabase functions deploy senior-chat --project-ref xoygyimwkmepwjqmnfxh
```

### Issue: "OPENAI_API_KEY is not configured"

**Cause:** Secret not set or wrong name

**Fix:**
1. Go to Supabase Dashboard → Project Settings → Edge Functions
2. Check if `OPENAI_API_KEY` exists under Secrets
3. If not, add it
4. If yes, make sure the value is correct
5. Redeploy after changing:
   ```bash
   npx supabase functions deploy senior-chat
   ```

### Issue: Frontend gets CORS error

**Cause:** Request is being blocked

**Check:**
1. Make sure URL in `SeniorChat.tsx` is correct
2. Should be: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/senior-chat`
3. Check your `.env` file has correct `VITE_SUPABASE_URL`

---

## What Error Are You Seeing?

To help you further, I need to know:

1. **Browser console error** (exact message)
2. **Network tab status code** (200, 404, 500, etc.)
3. **Edge function logs** (from Supabase dashboard)
4. **Is the function deployed?** (check Supabase Edge Functions page)

Please check these and let me know what you find!

---

## Quick Commands Reference

```bash
# Deploy edge function
npx supabase functions deploy senior-chat --project-ref xoygyimwkmepwjqmnfxh

# View logs
npx supabase functions logs senior-chat --project-ref xoygyimwkmepwjqmnfxh

# List secrets
npx supabase secrets list --project-ref xoygyimwkmepwjqmnfxh

# Set secret
npx supabase secrets set OPENAI_API_KEY=sk-your-key-here --project-ref xoygyimwkmepwjqmnfxh
```

---

## Still Not Working?

If you've checked everything above and it's still failing, the issue might be:

1. **API key has no credits** → Check OpenAI billing
2. **API key is restricted to specific IPs** → Remove IP restrictions
3. **Supabase project has issues** → Check Supabase status page
4. **Browser cache** → Try incognito mode
5. **Environment variable mismatch** → Double-check `.env` file

Let me know what you find and I can help debug further!
