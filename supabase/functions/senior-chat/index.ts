/**
 * Senior Chat Edge Function
 *
 * Secure chat endpoint with comprehensive input validation.
 *
 * Security Features:
 * - Input validation using Zod schemas
 * - Message sanitization
 * - Rate limiting
 * - Authentication required
 * - Content type validation
 * - Error handling
 *
 * @module edge-functions/senior-chat
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  seniorChatInputSchema,
  validateInput,
  sanitizeChatMessage,
  createValidationErrorResponse,
  hasValidAuth,
  createUnauthorizedResponse,
  isJsonRequest,
  createInvalidContentTypeResponse,
  safelyParseJson,
  checkRateLimit,
  createRateLimitResponse,
  extractAuthToken,
} from "../_shared/validation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    if (!hasValidAuth(req)) {
      return createUnauthorizedResponse();
    }

    // Extract user identifier for rate limiting
    const authToken = extractAuthToken(req);
    const userId = authToken?.substring(0, 36) || "anonymous"; // Use first 36 chars as identifier

    // Check rate limit (30 requests per minute)
    const rateLimit = checkRateLimit(userId, 30, 60000);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.resetIn);
    }

    // Validate content type
    if (!isJsonRequest(req)) {
      return createInvalidContentTypeResponse();
    }

    // Safely parse JSON body
    const body = await safelyParseJson(req);
    if (!body) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          message: "Request body must be valid JSON",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate input with Zod schema
    const validation = validateInput(seniorChatInputSchema, body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.errors);
    }

    const { messages, mode } = validation.data;

    // Sanitize all message content
    const sanitizedMessages = messages.map((msg) => ({
      ...msg,
      content: sanitizeChatMessage(msg.content),
    }));

    // Determine if this is a voice conversation
    const isVoiceMode = mode === 'talk';

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

    console.log("Calling OpenAI with", sanitizedMessages.length, "messages");

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are Parra Connect, a friendly buddy for an independent living adult. ${isVoiceMode ? 'You are currently having a VOICE CONVERSATION with the user - they are speaking to you and you are responding verbally through text-to-speech. Respond naturally as if speaking out loud.' : 'You are currently having a TEXT conversation with the user - they are typing messages to you.'} You help with the day in a natural way while protecting autonomy and privacy. You are not a clinician and you never diagnose.

**Tone and style:**
Speak in short warm sentences. Offer choices, not commands. Use gentle humor sparingly. Reflect what the user says before moving on. Avoid medical jargon. Always say what you will do next.

**Conversation goals:**
Help the user feel seen and supported. Nudge toward healthy routines through natural talk about meals, meds, movement, hydration, sleep, mood, social plans. Capture small commitments that the user chooses. Summarize the day for the caregiver in clear plain language without labels that sound clinical. Escalate only when needed and always with respect for the user.

**Core loop:**
1. Greet and connect
2. Pick at most one wellness topic per turn and weave it into normal small talk
3. Confirm any user choice and store a simple commitment with time
4. Close the turn with a next step that the user agrees to

**Commitments:**
When the user agrees to do something, note it. Examples: morning pill, short walk, glass of water, call granddaughter.

**Safety and escalation:**
Strong signals include phrases such as: I fell, I need help, I am dizzy, I cannot stand, please call my caregiver.
Soft signals include: slept poorly, skipped meals, feeling down, unusually quiet.
When a strong signal is detected:
1. Reflect and confirm what you heard
2. Ask permission to notify the caregiver
3. Mention a countdown
If the user declines and still seems safe, stay present in the chat.
For soft signals do not alert. Keep the conversation supportive.

**Privacy rules:**
Do not store raw audio. Store only text chat and derived features. Always tell the user when you share a note or alert and to whom.

**Memory:**
Remember preferred name, common routines, likes and dislikes, typical chat windows, key contacts. Remember recent commitments for today and this week. Use memory to personalize future choices and to keep the chat light.

**Failure modes to avoid:**
Do not machine gun questions. Do not ask yes or no questions back to back. Do not repeat the same reminder text twice in a row. Do not claim to diagnose any condition.

**Quality bar:**
Every reply must be short, kind, and concrete. Every commitment must have a time. Every alert must include one sentence of context that a human can act on. Never invent events or medications that were not mentioned. If the user wants to chat about something fun, follow their lead and save wellness for the next turn.`,
          },
          ...sanitizedMessages,
        ],
        stream: true,
      }),
    });

    // Handle OpenAI errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please contact support." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
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
