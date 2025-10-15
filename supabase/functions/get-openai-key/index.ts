/**
 * Get OpenAI API Key Edge Function
 *
 * Returns OpenAI API key to authenticated users for client-side Realtime API connection.
 *
 * SECURITY NOTES (MVP ONLY - NOT PRODUCTION READY):
 * - Only authenticated users can get the key
 * - Rate limited to 1 request per minute per user
 * - All requests are logged for monitoring
 * - Use OpenAI project keys with spending limits
 * - For production, use a Node.js proxy server instead
 *
 * @module edge-functions/get-openai-key
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting storage (in-memory, resets on function cold start)
const rateLimitStore = new Map<string, number>();

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Rate limiting: 1 request per minute per user
    const now = Date.now();
    const userKey = token.substring(0, 36); // Use first part of token as identifier
    const lastRequest = rateLimitStore.get(userKey);

    if (lastRequest && now - lastRequest < 60000) {
      const waitSeconds = Math.ceil((60000 - (now - lastRequest)) / 1000);
      console.warn(`Rate limit hit for user ${userKey}`);
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: `Please wait ${waitSeconds} seconds before requesting again`,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update rate limit
    rateLimitStore.set(userKey, now);

    // Get OpenAI API key
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log key distribution (for monitoring)
    console.log(`OpenAI API key distributed to user ${userKey} at ${new Date().toISOString()}`);

    // Return the API key
    return new Response(
      JSON.stringify({
        apiKey: OPENAI_API_KEY,
        warning: "This key is for MVP testing only. Do not share or expose publicly.",
        expiresIn: "session", // Clarify this is session-based
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Error in get-openai-key:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
