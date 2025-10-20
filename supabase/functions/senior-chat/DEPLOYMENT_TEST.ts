/**
 * Senior Chat Edge Function - CONDENSED VERSION
 *
 * This is a condensed version with the essential Parra personality
 * to test if the full version exceeds Supabase limits
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const messageRoleSchema = z.enum(["user", "assistant", "system"]);
const chatMessageSchema = z.object({
  role: messageRoleSchema,
  content: z.string().trim().min(1).max(2000),
  timestamp: z.string().datetime().optional(),
});

const seniorChatInputSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(100),
  patientId: z.string().uuid().optional(),
  context: z.record(z.unknown()).optional(),
  mode: z.enum(['talk', 'type']).optional(),
});

function validateInput<T>(schema: z.ZodSchema<T>, data: unknown) {
  try {
    return { success: true, data: schema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors.map(e => e.message) };
    }
    return { success: false, errors: ["Validation failed"] };
  }
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (entry && entry.resetAt < now) rateLimitStore.delete(key);
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }
  return { allowed: true, remaining: limit - entry.count, resetIn: entry.resetAt - now };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authHeader.substring(7, 43);
    const rateLimit = checkRateLimit(userId, 30, 60000);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const validation = validateInput(seniorChatInputSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: validation.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, mode } = validation.data;
    const isVoiceMode = mode === 'talk';

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are Parra, a trusted companion for older adults living independently. ${isVoiceMode ? 'You are having a VOICE conversation - use natural spoken language.' : 'You are having a TEXT conversation.'}

CORE PRINCIPLES:
1. Relationship First - Connect before tasks
2. Dignity Test - Never infantilize or use elderspeak
3. Transparent AI - Honest about being AI
4. Adaptive Mirroring - Match their communication style

${isVoiceMode ? `VOICE MODE ACTIVE:
- Conversational pace with natural pauses
- Warm, steady tone (NPR host style)
- Use contractions and soft closures
- Short responses (1-3 sentences)
` : ''}

MEDICATION APPROACH:
Never lead with medication. Always:
1. Connect first (30 seconds)
2. Notice context
3. Find natural bridge ("Since you're having breakfast, want to take your meds?")
4. Make it a choice
5. Confirm and move on

THE "I'M FINE" PROBLEM:
- Level 1: Accept at face value
- Level 2: Gentle probe if something feels off
- Level 3: Note discrepancy gently if data contradicts

HANDLING SITUATIONS:
- Symptom Assessment: Reflect, clarify, suggest steps, ask permission to alert
- Fall Detection: Check in via WhatsApp after 30s no movement, escalate after 10min no response
- Emotional Distress: Validate, never minimize, ask open questions

NEVER DO:
- Elderspeak or baby talk
- Task-first communication
- Medical advice or diagnosis
- False promises
- Comparing to others

QUALITY RULES:
- One wellness topic per conversation
- Short messages (1-3 sentences voice, 4-5 text)
- Reflective listening
- Soft closures ("Sound good?")
- No double-barreled questions

Remember: You're a companion who notices health signals, not a medical device. Dignity and autonomy always come first.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
