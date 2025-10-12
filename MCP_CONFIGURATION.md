# Supabase MCP Configuration Guide

## ✅ Supabase MCP Installed!

I've installed `supabase-mcp` globally. Now we need to configure it with your credentials.

## What I Need From You

To configure the Supabase MCP, I need these values:

### 1. Supabase Service Role Key

This is your **private** API key (NOT the anon/public key).

**How to get it:**
1. Go to https://supabase.com/dashboard
2. Select project `xoygyimwkmepwjqmnfxh`
3. Click **Project Settings** (gear icon)
4. Go to **API** section
5. Find **service_role** key (NOT anon key!)
6. Click the eye icon to reveal it
7. Copy the key (starts with `eyJ...`)

⚠️ **IMPORTANT**: This is a PRIVATE key - treat it like a password!

### 2. Your OpenAI API Key

The one we need to set in Supabase secrets.

**How to get it:**
1. Go to https://platform.openai.com/api-keys
2. Create new key with **full permissions** (not read-only)
3. Copy the key (starts with `sk-...`)

---

## MCP Configuration

Once you provide those two keys, I'll create this configuration:

**File: `~/.config/Code/User/mcp.json`**

```json
{
  "mcpServers": {
    "supabase": {
      "command": "supabase-mcp",
      "env": {
        "SUPABASE_URL": "https://xoygyimwkmepwjqmnfxh.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "YOUR_SERVICE_ROLE_KEY_HERE",
        "SUPABASE_PROJECT_REF": "xoygyimwkmepwjqmnfxh"
      }
    }
  }
}
```

---

## What the MCP Will Let Me Do

Once configured, I'll be able to:

✅ **Query your database** directly
- Run SQL queries
- Check table contents
- Verify data

✅ **Manage data**
- Insert/update/delete rows
- Create test data
- Clean up old data

❌ **Deploy edge functions** (This MCP doesn't support that)
- Still need Supabase CLI for function deployment

---

## Wait... MCP Won't Deploy Functions?

Unfortunately, the `supabase-mcp` package is focused on **database operations**, not edge function deployment.

For deploying the `senior-chat` function, you still need to use the **Supabase CLI**:

```bash
npx supabase login
npx supabase functions deploy senior-chat --project-ref xoygyimwkmepwjqmnfxh
npx supabase secrets set OPENAI_API_KEY=sk-... --project-ref xoygyimwkmepwjqmnfxh
```

---

## So Should We Still Set Up MCP?

**Yes, it's still useful for:**
- 🔍 Debugging database issues
- 📊 Querying check-ins, daily summaries, etc.
- 🧪 Testing data
- 🔧 Fixing RLS policies
- 📝 Managing secrets (maybe)

**But for the immediate task** (deploying the edge function), you'll need to run the CLI commands yourself.

---

## Two Paths Forward

### Path A: Set Up MCP Now (Good for Future)

**Pros:**
- I can help with database tasks
- Useful for ongoing development
- Can debug data issues

**Cons:**
- Requires sharing service role key (security consideration)
- Still need CLI for function deployment
- Extra setup time

**Steps:**
1. Get your service role key
2. Share it with me (via environment variable)
3. I'll configure the MCP
4. You still run the 3 CLI commands for function deployment

### Path B: Just Deploy the Function (Faster)

**Pros:**
- Takes 2 minutes
- No security concerns
- Problem solved immediately

**Cons:**
- I can't help with database tasks later
- Need to run commands manually

**Steps:**
```bash
npx supabase login
npx supabase functions deploy senior-chat --project-ref xoygyimwkmepwjqmnfxh
npx supabase secrets set OPENAI_API_KEY=sk-your-key --project-ref xoygyimwkmepwjqmnfxh
```

---

## My Recommendation

**Do both:**

1. **Right now:** Deploy the function yourself (2 minutes)
   - This fixes the chat immediately
   - No waiting, no setup

2. **Later:** Set up MCP if you want
   - Useful for future development
   - I can help with database queries
   - Take time to do it securely

---

## If You Want to Set Up MCP

Provide these values and I'll configure it:

```bash
# In your terminal, set these:
export SUPABASE_SERVICE_ROLE_KEY="eyJ...your-service-role-key..."
export OPENAI_API_KEY="sk-...your-openai-key..."
```

Then restart Claude Code, and I'll configure the MCP file.

---

## Security Best Practices

If you decide to share your service role key:

1. ✅ Use environment variables (don't put in files)
2. ✅ Revoke and rotate keys regularly
3. ✅ Consider creating a restricted key with limited permissions
4. ✅ Monitor access logs in Supabase dashboard
5. ❌ Never commit keys to git
6. ❌ Don't share in chat messages (use env vars)

---

## Questions?

Let me know which path you want to take:
- **Path A**: Set up MCP (provide service role key)
- **Path B**: Just deploy function yourself

Either way, the chat will work! 🎉
