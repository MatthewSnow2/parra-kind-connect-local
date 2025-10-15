# Voice Chat Deployment Guide

This guide covers deploying the OpenAI Realtime API proxy server to Render and configuring your frontend.

## What We've Completed ✅

- ✅ Created Node.js WebSocket proxy server (`openai-proxy/`)
- ✅ Updated frontend to connect via proxy (`src/hooks/useRealtimeVoice.ts`)
- ✅ Added Render deployment configuration (`openai-proxy/render.yaml`)
- ✅ Installed proxy dependencies
- ✅ Committed and pushed code to GitHub

## Tasks You Need to Complete

### 1. Deploy Proxy Server to Render

**Step 1.1: Access Render Dashboard**
- Go to https://dashboard.render.com/
- Log in to your account (you mentioned having a suspended server)

**Step 1.2: Create New Web Service**
- Click "New +" button (top right)
- Select "Web Service"

**Step 1.3: Connect Repository**
- Select "Build and deploy from a Git repository"
- Click "Next"
- Find and select your repository: `MatthewSnow2/parra-kind-connect-local`
- Click "Connect"

**Step 1.4: Configure Service**
Fill in these settings:
- **Name:** `openai-realtime-proxy` (or any name you prefer)
- **Region:** Choose closest to your users (e.g., Oregon for US West)
- **Branch:** `main`
- **Root Directory:** `openai-proxy` ⚠️ IMPORTANT - don't skip this!
- **Runtime:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** Free (or upgrade for always-on service)

**Step 1.5: Add Environment Variables**
In the Environment section, add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `OPENAI_API_KEY` | `sk-proj-...` | Your OpenAI API key |
| `ALLOWED_ORIGINS` | `*` | For MVP, use `*`. For production, use your domain |

To get your OpenAI API key:
- Go to https://platform.openai.com/api-keys
- Create new key or use existing one
- Copy the key (starts with `sk-proj-`)

**Step 1.6: Deploy**
- Click "Create Web Service"
- Wait for deployment (usually 2-3 minutes)
- Once deployed, copy your service URL (looks like: `https://openai-realtime-proxy.onrender.com`)

---

### 2. Update Frontend Configuration

**Step 2.1: Update .env.local**
In your local project, update or create `.env.local`:

```bash
# Copy from .env.example if needed
cp .env.example .env.local
```

Then edit `.env.local` and update:
```
VITE_REALTIME_PROXY_URL="wss://openai-realtime-proxy.onrender.com"
```
⚠️ Replace `openai-realtime-proxy.onrender.com` with your actual Render URL (use `wss://` not `ws://`)

**Step 2.2: Test Locally**
```bash
npm run dev
```
- Navigate to Parra Connect
- Try voice chat
- Check browser console for connection messages

**Step 2.3: Build and Deploy Frontend**
```bash
npm run build
```

Then deploy to Netlify (or your hosting platform):
- Drag the `dist` folder to Netlify
- Or use `netlify deploy --prod`

**Step 2.4: Update Production Environment Variables**
In Netlify (or your hosting platform):
- Go to Site settings → Environment variables
- Add or update: `VITE_REALTIME_PROXY_URL` = `wss://your-render-url.onrender.com`
- Trigger a redeploy if needed

---

### 3. Test Voice Chat

**Step 3.1: Test Connection**
1. Open your deployed Parra Connect site
2. Log in
3. Navigate to chat
4. Click the microphone button
5. Allow microphone access when prompted

**Step 3.2: Monitor Logs**
- **Render Logs:** Go to your Render service → Logs tab
- **Browser Console:** Open DevTools → Console tab

Look for:
- ✅ "Connected to voice proxy server"
- ✅ "Connected to OpenAI Realtime API"
- ❌ Any error messages

**Step 3.3: Test Voice Conversation**
- Speak to Parra
- Verify you hear a response
- Check that the voice sounds natural (not robotic)
- Test multiple turns of conversation

---

## Troubleshooting

### Proxy Server Issues

**Error: "Service unavailable" or 503**
- Render free tier spins down after 15 minutes of inactivity
- First request may take 30-60 seconds (cold start)
- Upgrade to paid plan for always-on service

**Error: "OpenAI connection failed"**
- Check `OPENAI_API_KEY` is correctly set in Render environment variables
- Verify API key is valid at https://platform.openai.com/api-keys
- Ensure you have credits in your OpenAI account

**Error: "Invalid authentication"**
- Client is not sending valid Supabase JWT token
- Check user is logged in
- Verify Supabase session is active

### Frontend Connection Issues

**Error: "Connection error" or WebSocket fails**
- Verify `VITE_REALTIME_PROXY_URL` is correctly set
- Make sure URL uses `wss://` not `ws://`
- Check Render service is running (check Render dashboard)
- Clear browser cache and hard refresh

**Audio not playing**
- Check browser console for audio playback errors
- Verify microphone permission was granted
- Try in different browser (Chrome/Edge recommended)

**No response from Parra**
- Check both Render logs and browser console
- Verify OpenAI API has credits
- Check for rate limiting errors

---

## Cost Monitoring

**OpenAI Costs:**
- ~$0.30 per minute of voice conversation
- Set spending limits at https://platform.openai.com/account/billing

**Render Costs:**
- Free tier: 750 hours/month
- Paid plans start at $7/month for always-on

---

## Optional: Cleanup Old Functions

Since we're now using the proxy server, these Supabase Edge Functions are no longer needed:
- `realtime-voice-chat` (deprecated - Deno can't handle headers)
- `get-openai-key` (no longer needed)

You can delete them in Supabase dashboard or keep them for reference.

---

## Next Steps After Deployment

1. Monitor usage and costs
2. Set OpenAI spending limits
3. Test thoroughly with real users
4. Consider upgrading Render to paid plan for production
5. Add proper JWT verification in proxy server for production

---

## Support

If you encounter issues:
1. Check Render logs first
2. Check browser console second
3. Verify all environment variables are set correctly
4. Ensure OpenAI account has credits

For detailed technical documentation, see: `openai-proxy/README.md`
