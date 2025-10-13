# Setting Up Supabase MCP for Claude Code

## Important Note

As of now, there is **no official Supabase MCP server** published by Supabase or the community. However, I can help you deploy the edge function using the Supabase CLI that you'll need to set up.

## Current Situation

**What we need:**
- Deploy the `senior-chat` edge function to Supabase
- Configure the `OPENAI_API_KEY` secret

**Why MCP won't help right now:**
- No official Supabase MCP exists yet
- Even with MCP, you'd need Supabase CLI installed
- Authentication still requires your personal access token

## Alternative: Give Me Your Supabase Access Token (Temporary)

If you want me to deploy the function for you right now, you can provide your Supabase access token as an environment variable. Here's how:

### Option 1: Environment Variable (Temporary Session)

1. **Get your access token:**
   - Go to https://supabase.com/dashboard/account/tokens
   - Click "Generate new token"
   - Give it a name like "Claude Code Deployment"
   - Copy the token

2. **Set it in your terminal** (where you run Claude Code):
   ```bash
   export SUPABASE_ACCESS_TOKEN="sbp_your_token_here"
   ```

3. **Then I can deploy:**
   ```bash
   npx supabase functions deploy senior-chat --project-ref xoygyimwkmepwjqmnfxh
   ```

⚠️ **Security Note:** This token gives full access to your Supabase project. Only use this temporarily and revoke it when done.

---

## Option 2: You Deploy Manually (Recommended for Security)

This is the safest and fastest approach:

```bash
# 1. Login (one-time)
npx supabase login

# 2. Deploy function
npx supabase functions deploy senior-chat --project-ref xoygyimwkmepwjqmnfxh

# 3. Set OpenAI key
npx supabase secrets set OPENAI_API_KEY=sk-your-key-here --project-ref xoygyimwkmepwjqmnfxh

# 4. Verify
npx supabase functions list --project-ref xoygyimwkmepwjqmnfxh
```

This takes about 2 minutes total.

---

## Future: Build a Custom Supabase MCP

If you want to create a reusable Supabase MCP for future projects, here's what it would need:

### What a Supabase MCP Would Provide

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "supabase-mcp-server"],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}",
        "SUPABASE_PROJECT_REF": "xoygyimwkmepwjqmnfxh"
      }
    }
  }
}
```

### Tools it would expose:
- `deploy_function` - Deploy edge functions
- `set_secret` - Configure secrets
- `get_logs` - Fetch function logs
- `list_functions` - List deployed functions
- `run_migration` - Execute database migrations
- `query_database` - Run SQL queries

### Building It

Since no official one exists, you could create one:

```bash
# Create a new MCP server
mkdir supabase-mcp-server
cd supabase-mcp-server
npm init -y

# Install dependencies
npm install @modelcontextprotocol/sdk @supabase/supabase-js

# Create index.js with MCP server implementation
# (Would need to wrap Supabase CLI commands)
```

But this is a significant undertaking and probably overkill for just deploying one function.

---

## What I Recommend Right Now

**Just run these 3 commands yourself:**

```bash
npx supabase login
npx supabase functions deploy senior-chat --project-ref xoygyimwkmepwjqmnfxh
npx supabase secrets set OPENAI_API_KEY=sk-your-actual-key --project-ref xoygyimwkmepwjqmnfxh
```

**Why this is better:**
- ✅ Takes 2 minutes
- ✅ No security risks
- ✅ You maintain control
- ✅ Works immediately
- ✅ No additional setup needed

**After that:**
- Chat will work instantly
- You can test at `/senior/chat`
- No MCP needed for this task

---

## If You Still Want to Give Me Access

If you really want me to deploy it for you, you can:

1. Generate a Supabase access token (link above)
2. Run this in your terminal:
   ```bash
   export SUPABASE_ACCESS_TOKEN="your_token_here"
   ```
3. Restart Claude Code in that terminal
4. I'll be able to run Supabase CLI commands

**But honestly**, it's faster and safer for you to just run the 3 commands yourself. 😊

---

## Summary

- ❌ No official Supabase MCP exists yet
- ✅ Supabase CLI works great without MCP
- ⚡ Fastest solution: Run the 3 commands yourself
- 🔒 Safest solution: Don't share access tokens
- ⏱️  Time to deploy: ~2 minutes manually

Let me know if you want help with anything else!
