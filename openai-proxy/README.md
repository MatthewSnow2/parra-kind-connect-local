# OpenAI Realtime API WebSocket Proxy

Node.js WebSocket proxy server that enables browser clients to connect to OpenAI's Realtime API.

## Why This Proxy?

Browser WebSocket connections cannot send custom headers (like `Authorization`). OpenAI's Realtime API requires `Authorization: Bearer {api_key}` header, making direct browser connections impossible.

This proxy:
- Accepts WebSocket connections from browser clients
- Validates client authentication (Supabase JWT token)
- Proxies to OpenAI Realtime API with proper Authorization header
- Bidirectionally streams messages between client and OpenAI

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Add your OpenAI API key to `.env`:**
   ```
   OPENAI_API_KEY=sk-proj-...
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Test health endpoint:**
   ```bash
   curl http://localhost:8080/health
   ```

## Deployment to Render

### Option 1: Using Render Dashboard

1. **Create new Web Service:**
   - Go to https://dashboard.render.com/
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository with this code

2. **Configure service:**
   - **Name:** `openai-realtime-proxy`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Root Directory:** `openai-proxy`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or upgrade as needed)

3. **Add environment variables:**
   - Go to Environment tab
   - Add `OPENAI_API_KEY` with your OpenAI API key
   - Add `ALLOWED_ORIGINS` with your frontend domain (e.g., `https://yourdomain.com`)

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note your service URL (e.g., `https://openai-realtime-proxy.onrender.com`)

### Option 2: Using render.yaml

1. **Push code to GitHub**
2. **In Render Dashboard:**
   - Click "New +" → "Blueprint"
   - Connect your repository
   - Render will auto-detect `render.yaml`
3. **Add environment variables in Render dashboard**
4. **Deploy**

## WebSocket Connection

**Client-side connection URL:**
```javascript
const wsUrl = `wss://your-proxy-url.onrender.com?token=${supabaseToken}`;
const ws = new WebSocket(wsUrl);
```

**URL Parameters:**
- `token`: Supabase JWT access token (required for authentication)

## Security

- ✅ Validates client Supabase JWT tokens
- ✅ OpenAI API key stored securely in environment variables
- ✅ Health check endpoint for monitoring
- ✅ Graceful shutdown handling
- ⚠️ For production, implement proper JWT verification with Supabase

## Monitoring

**Health Check:**
```bash
curl https://your-proxy-url.onrender.com/health
```

**Logs:**
- In Render dashboard, go to Logs tab
- Watch for connection events:
  - 🔌 New client connections
  - ✅ Successful OpenAI connections
  - ❌ Errors and rejections

## Troubleshooting

**Connection rejected:**
- Check that client is sending valid Supabase JWT token
- Verify token is at least 20 characters long

**OpenAI connection fails:**
- Verify `OPENAI_API_KEY` is correctly set in environment variables
- Check OpenAI API key is valid and has Realtime API access
- Ensure you have credits in your OpenAI account

**Client messages not reaching OpenAI:**
- Check WebSocket connection state in logs
- Verify session configuration was sent successfully

## Cost Management

**OpenAI Realtime API Pricing:**
- Audio input: $0.06 per minute
- Audio output: $0.24 per minute
- Total: ~$0.30 per minute of conversation

**Render Free Tier:**
- 750 hours/month free
- Service spins down after 15 minutes of inactivity
- First request after spin-down may be slow (cold start)

**For production:**
- Upgrade Render plan for always-on service
- Set OpenAI spending limits in OpenAI dashboard
- Monitor usage and implement rate limiting
