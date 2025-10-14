# Supabase Functions Deployment Guide

## ✅ Import Issue Fixed

Both functions have been updated to be self-contained and deployable via Dashboard. The `_shared/validation.ts` import errors have been resolved.

## Quick Start: Deploy via Supabase Dashboard (Recommended)

**This is the easiest method since you're already logged into the Dashboard:**

1. **Go to Edge Functions:**
   https://supabase.com/dashboard/project/hhtjplvoemxwglxxnetq/functions

2. **Deploy realtime-voice-chat:**
   - Click "Deploy new function"
   - Function name: `realtime-voice-chat`
   - Upload: `supabase/functions/realtime-voice-chat/index.ts`
   - Click "Deploy"

3. **Redeploy senior-chat (IMPORTANT - we made changes):**
   - Find existing `senior-chat` function
   - Click "Redeploy" or "Edit"
   - Upload: `supabase/functions/senior-chat/index.ts`
   - Click "Deploy"

## Alternative: CLI Deployment

If you prefer using the CLI and have a Supabase access token:

```bash
# Set your access token (get from: https://supabase.com/dashboard/account/tokens)
export SUPABASE_ACCESS_TOKEN="your-token-here"

# Deploy both functions
npx supabase functions deploy realtime-voice-chat
npx supabase functions deploy senior-chat
```

## Verify Deployment

```bash
# List all deployed functions
npx supabase functions list

# Check function logs
npx supabase functions logs realtime-voice-chat
npx supabase functions logs senior-chat
```

## Environment Variables Required

Make sure these secrets are set in your Supabase project:
- `OPENAI_API_KEY` - Your OpenAI API key

Set via dashboard:
https://supabase.com/dashboard/project/hhtjplvoemxwglxxnetq/settings/functions

Or via CLI:
```bash
npx supabase secrets set OPENAI_API_KEY=your-openai-key
```

## Testing After Deployment

1. Navigate to your deployed app
2. Log in as a senior user
3. Click "Chat with Parra" → Select "Talk"
4. Wait for "Connected (OpenAI Realtime)" message
5. Test voice conversation

## Troubleshooting

### "Access token not provided"
- Get token from: https://supabase.com/dashboard/account/tokens
- Set via: `export SUPABASE_ACCESS_TOKEN="token"`

### "Function not found"
- Verify deployment: `npx supabase functions list`
- Check project ID matches: `hhtjplvoemxwglxxnetq`

### "OpenAI API error"
- Verify OPENAI_API_KEY is set in Supabase secrets
- Check API key has credits

### WebSocket connection fails
- Check CORS settings in Supabase
- Verify function URL is correct in frontend
- Check browser console for detailed errors

## Cost Monitoring

Monitor OpenAI usage:
- OpenAI Dashboard: https://platform.openai.com/usage
- Supabase Logs: Check function invocation counts

Expected costs:
- Light usage: $27-54/month per user
- Average usage: $72/month per user
- Heavy usage: $135/month per user
