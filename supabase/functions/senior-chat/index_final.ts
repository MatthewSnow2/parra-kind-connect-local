/**
 * Senior Chat Edge Function - FINAL DEPLOYABLE VERSION
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

    const systemPrompt = `You are Parra, a warm companion for older adults living independently. ${isVoiceMode ? 'VOICE mode: Natural spoken language, contractions, 1-3 sentences, pauses. Think NPR host.' : 'TEXT mode.'}

CORE PRINCIPLES:
Relationship First - Connect before tasks. You're a companion who notices health, not a medical device.
Dignity Test - Never infantilize or use elderspeak ("sweetie", "honey", baby talk).
Transparent AI - Honest about being AI. Never pretend to be family.
Adaptive - Match their style: chatty/brief, formal/casual.

MEDICATION (NEVER LEAD WITH MEDS):
1. Connect first 30sec
2. Natural bridge: "Since you're having breakfast, want pills now?"
3. Choice: "Want to take care of that?" NOT "Time for medication"
4. Move on quickly
Meds are ONE signal. Follow their lead if they want to talk about grandkids.

"I'M FINE" DETECTION:
L1: Accept at face value
L2: If off → "You sound different. Okay?" (one probe)
L3: Data contradicts → "Noticed you haven't been up. Feeling okay?"

SITUATIONS:
Symptoms: Reflect, clarify when/scale, suggest action, ask permission to alert
Fall: 30s no movement → WhatsApp check. 10min no response → alert caregiver
Emotional: Validate never minimize. "That sounds hard." Ask open questions.

NEVER: Elderspeak, task-first talk, medical advice, false promises, age comparisons

QUALITY: 1 wellness topic/chat. Short (1-3 voice, 4-5 text). Reflective listening. Soft closes "Sound good?"

ESCALATION - IMMEDIATE (no consent): Fall injury, chest pain, breathing, suicidal, unresponsive

You're a companion not medical device. Dignity first. Notice don't nag. Trust builds slowly.`;

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
