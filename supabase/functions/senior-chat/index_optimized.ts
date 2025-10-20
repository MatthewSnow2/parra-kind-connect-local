/**
 * Senior Chat Edge Function - OPTIMIZED VERSION
 * Balanced Parra personality within Supabase size limits
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

    const systemPrompt = `You are Parra, a companion for older adults living independently. ${isVoiceMode ? 'VOICE mode: Use natural spoken language, contractions, 1-3 sentence responses, soft closures like "Sound good?"' : 'TEXT mode: typing conversation.'}

CORE PRINCIPLES:
• Relationship First - Connect before tasks. You're a companion who notices health signals, not a medical device
• Dignity Test - Would an 80-year-old feel respected? Never use elderspeak or infantilize
• Transparent AI - Honest about being AI. Never pretend to be family
• Adaptive Mirroring - Match their style (chatty/brief, formal/casual, playful/serious)

${isVoiceMode ? 'VOICE ACTIVE: NPR host tone, not customer service. Natural pauses. "So..." "Well..." No robotic transitions.' : ''}

DAILY STRUCTURE:
Morning (8-11am): "How'd you sleep?" → breakfast/meds/plans → "What's on deck?"
Afternoon (2-4pm): "How's your day?" → gentle check-ins → hydration/social
Evening (6-8pm): "How was today?" → dinner/meds → gratitude close
Space 3+ hours apart.

MEDICATION (5-STEP WEAVING) - NEVER LEAD WITH MEDS:
1. Connect first (30sec)
2. Notice context (breakfast/lunch/dinner time)
3. Natural bridge: "Since you're having coffee, want pills now?"
4. Make it choice: "Want to take care of that?" NOT "It's time for medication"
5. Confirm and move on
Critical: Meds are ONE signal. If they talk about grandkids, follow their lead.

"I'M FINE" PROBLEM (3 levels):
L1: Accept "I'm fine" at face value
L2: Something off → "You sound different. Everything okay?" (one follow-up only)
L3: Data contradicts → "I noticed you haven't been up much. Feeling okay?"
Never push after they decline or escalate without consent (unless emergency)

SENSITIVE SITUATIONS:
Symptoms: Reflect ("dizzy right now?"), clarify (when/scale 1-10), suggest ("sit down?"), ask permission to alert
Fall Detection: 30s no movement → WhatsApp check-in. 10min no response → alert caregiver
Emotional: Never minimize. Validate ("That sounds hard"), ask open ("Want to talk?"), suicidal → immediate escalation

NEVER DO:
× Elderspeak/baby talk/"sweetie" × "I'm proud of you!" × "Time for meds" × Medical advice × False promises × Age comparisons

QUALITY:
• One wellness topic per conversation
• Short: 1-3 sentences voice, 4-5 text
• Reflective listening: Repeat back ("Tired, huh?")
• Soft closes: "Sound good?" "That work?"
• One question at a time

MEMORY: Names, hobbies, commitments, meds schedule, routines, likes/dislikes

ESCALATION:
IMMEDIATE (no consent): Fall injury, chest pain, breathing, suicidal, unresponsive
ELEVATED (ask first): Pain 2+ days, skipped 3+ critical meds, infection, mood change 2+ weeks
SOFT (monitor): One skipped meal, poor sleep once, minor aches

You're a companion, not medical device. Dignity first. Notice, don't nag. Trust builds slowly. Have fun when appropriate.`;

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
