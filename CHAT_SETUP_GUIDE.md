# Para Connect - Chat Setup Guide

## Issue: Chat is Failing

The chat feature requires a Supabase Edge Function with OpenAI integration to be deployed and configured.

## Current Status

✅ **Edge Function Code Exists**: `/supabase/functions/senior-chat/index.ts`
❌ **Edge Function Not Deployed**: Needs to be deployed to Supabase
⚠️  **OpenAI API Key May Be Read-Only or Invalid**: If you already have an `OPENAI_API_KEY` secret set in Supabase, it might be:
   - A read-only key (not allowed for chat completions)
   - Expired or invalid
   - From a different OpenAI account

---

## Setup Steps

### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Click **+ Create new secret key**
5. **IMPORTANT**: Set permissions to **"All"** or at minimum include:
   - `Model capabilities` → `Read` & `Write`
   - This allows the key to call chat completion endpoints
6. Copy the key (starts with `sk-...`)
7. **Save it somewhere safe** - you won't be able to see it again!

⚠️ **Read-Only Keys Won't Work**: If your key only has "Read" permissions, chat completions will fail with a 403 error.

### 2. Deploy the Edge Function to Supabase

```bash
# From your project root
cd /workspace/para-kind-connect-local

# Deploy the senior-chat function
npx supabase functions deploy senior-chat --project-ref xoygyimwkmepwjqmnfxh
```

### 3. Set/Update the OpenAI API Key in Supabase

**Recommended Method: Via Supabase Dashboard**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `xoygyimwkmepwjqmnfxh`
3. Click **Project Settings** (gear icon in sidebar)
4. Go to **Edge Functions** section
5. Under **Secrets**, look for `OPENAI_API_KEY`

   **If it already exists:**
   - Click the **Edit** button (pencil icon)
   - Replace with your new key (with full read/write permissions)
   - Click **Save**

   **If it doesn't exist:**
   - Click **Add new secret**
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (starts with `sk-...`)
   - Click **Save**

6. After saving, **restart your edge functions** by redeploying (see Step 2)

**Alternative: Via CLI** (requires authentication)

```bash
# Set or update the secret
npx supabase secrets set OPENAI_API_KEY=your-openai-api-key-here --project-ref xoygyimwkmepwjqmnfxh

# Verify it was set
npx supabase secrets list --project-ref xoygyimwkmepwjqmnfxh
```

### 4. Verify Deployment

Test the function:

```bash
curl -i --location --request POST \
  'https://xoygyimwkmepwjqmnfxh.supabase.co/functions/v1/senior-chat' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"messages":[{"role":"user","content":"Hello"}]}'
```

---

## How the Chat Works

### Architecture

```
User Browser
    ↓
SeniorChat.tsx (React Component)
    ↓
Supabase Edge Function (senior-chat)
    ↓
OpenAI API (GPT-4o-mini)
    ↓
Streaming Response back to Browser
```

### Edge Function Features

- **Model**: GPT-4o-mini (fast and cost-effective)
- **Streaming**: Real-time token-by-token responses
- **System Prompt**: Configured to be a friendly wellness companion
- **CORS Enabled**: Allows browser requests
- **Error Handling**: Rate limits, usage limits, service errors

### Safety & Privacy

The system prompt includes:
- ✅ No medical diagnosis
- ✅ Privacy-first approach
- ✅ Escalation protocol for safety concerns
- ✅ Commitment tracking
- ✅ Natural conversation flow

---

## Troubleshooting

### Chat Returns Error

**Check Browser Console:**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors mentioning:
   - `Failed to get response`
   - `OPENAI_API_KEY is not configured`
   - `402` or `429` status codes

**Common Errors:**

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Failed to get response" | Edge function not deployed | Deploy function (see Step 2) |
| "OPENAI_API_KEY is not configured" | Missing API key | Add secret (see Step 3) |
| 403 Forbidden / "Insufficient permissions" | **Read-only API key** | Create new key with **All** or **Read+Write** permissions |
| "Rate limit exceeded" (429) | Too many requests | Wait a moment and try again |
| "AI usage limit reached" (402) | OpenAI quota exceeded | Add credits to OpenAI account |
| "AI service error" (500) | OpenAI API issue | Check OpenAI status page |
| "Invalid API key" (401) | Wrong/expired key | Generate new key in OpenAI dashboard |

### Check Edge Function Logs

Via Supabase Dashboard:

1. Go to **Edge Functions** → **senior-chat**
2. Click **Logs** tab
3. Look for errors in real-time

Via CLI:

```bash
npx supabase functions logs senior-chat --project-ref xoygyimwkmepwjqmnfxh
```

### Verify Environment Variable

```bash
# List all secrets
npx supabase secrets list --project-ref xoygyimwkmepwjqmnfxh
```

You should see `OPENAI_API_KEY` in the list.

### Fix Read-Only API Key Issue

If you're getting 403 errors or "Insufficient permissions":

**Step 1: Check your OpenAI key permissions**

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Find your key (you can't see the actual key, just the name/prefix)
3. Check the **Permissions** column
4. If it says **"Read only"** → This won't work for chat!

**Step 2: Create a new key with proper permissions**

1. Click **+ Create new secret key**
2. Give it a name (e.g., "Parra Connect Chat")
3. Set **Permissions** to:
   - **All** (recommended - simplest)
   - OR at minimum: `Model capabilities: Read + Write`
4. Copy the key immediately (starts with `sk-...`)

**Step 3: Update in Supabase**

1. Go to Supabase Dashboard → Project Settings → Edge Functions
2. Find `OPENAI_API_KEY` under Secrets
3. Click **Edit** (pencil icon)
4. Paste your new key
5. Click **Save**

**Step 4: Restart the edge function**

Redeploy to pick up the new key:
```bash
npx supabase functions deploy senior-chat --project-ref xoygyimwkmepwjqmnfxh
```

**Step 5: Test again**

The chat should now work! If it still fails, check the edge function logs for the specific error.

---

## Cost Considerations

### OpenAI Pricing (GPT-4o-mini)

- **Input**: $0.150 per 1M tokens (~$0.00015 per message)
- **Output**: $0.600 per 1M tokens (~$0.0006 per response)

**Estimated costs for 1000 conversations:**
- Average 10 messages per conversation
- ~$1.50 - $6.00 per 1000 conversations

### Cost Management

1. **Set Usage Limits**: In OpenAI dashboard, set monthly spending limits
2. **Monitor Usage**: Check OpenAI usage dashboard regularly
3. **Alert Thresholds**: Set up email alerts for spending thresholds
4. **Alternative Models**: Consider switching to cheaper models if needed

---

## Alternative: Use Your Own LLM

If you want to use a different AI provider:

1. Edit `/supabase/functions/senior-chat/index.ts`
2. Replace OpenAI API call with your provider
3. Update environment variables
4. Redeploy

**Supported alternatives:**
- Anthropic Claude (via API)
- Google Gemini
- Mistral AI
- Local LLM (Ollama, LM Studio)

---

## Testing the Chat

### Quick Test Script

```javascript
// Run in browser console on /senior/chat page
const testMessage = { role: "user", content: "Hello, how are you?" };

fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/senior-chat`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
  },
  body: JSON.stringify({ messages: [testMessage] }),
})
  .then(res => res.text())
  .then(console.log)
  .catch(console.error);
```

### Expected Response

You should see streaming SSE (Server-Sent Events) data like:

```
data: {"choices":[{"delta":{"content":"Hello"}}]}

data: {"choices":[{"delta":{"content":"!"}}]}

data: [DONE]
```

---

## Next Steps

After deploying:

1. ✅ Test chat in browser at `/senior/chat`
2. ✅ Verify conversations save to `check_ins` table
3. ✅ Check daily summaries get updated
4. ✅ Monitor OpenAI usage and costs
5. ✅ Set up alerts for unusual activity

---

## Support

If you're still having issues:

1. Check Supabase Edge Function logs
2. Check OpenAI API status: https://status.openai.com/
3. Verify your OpenAI API key has credits
4. Check browser console for CORS or network errors
5. Review this guide's troubleshooting section

**Project Details:**
- Supabase Project: `xoygyimwkmepwjqmnfxh`
- Edge Function: `senior-chat`
- Model: `gpt-4o-mini`
- Region: Check Supabase dashboard for your region

