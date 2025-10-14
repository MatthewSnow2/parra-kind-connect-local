/**
 * Realtime Voice Chat Edge Function
 *
 * WebSocket proxy to OpenAI's Realtime API for natural voice conversations.
 * Handles bidirectional audio streaming with low latency.
 *
 * @module edge-functions/realtime-voice-chat
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Extract Bearer token from Authorization header
 */
function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Validate request has required authorization
 */
function hasValidAuth(req: Request): boolean {
  const token = extractAuthToken(req);
  return token !== null && token.length > 0;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    if (!hasValidAuth(req)) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Valid authorization required",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check for WebSocket upgrade request
    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket connection", {
        status: 426,
        headers: corsHeaders,
      });
    }

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

    // Upgrade the incoming connection to WebSocket
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);

    // Connect to OpenAI Realtime API
    const openaiWs = new WebSocket(
      "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17",
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "realtime=v1",
        },
      }
    );

    // Handle client -> OpenAI messages
    clientSocket.onmessage = (event) => {
      try {
        if (openaiWs.readyState === WebSocket.OPEN) {
          openaiWs.send(event.data);
        }
      } catch (error) {
        console.error("Error forwarding to OpenAI:", error);
      }
    };

    // Handle OpenAI -> client messages
    openaiWs.onmessage = (event) => {
      try {
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(event.data);
        }
      } catch (error) {
        console.error("Error forwarding to client:", error);
      }
    };

    // Handle OpenAI connection open
    openaiWs.onopen = () => {
      console.log("Connected to OpenAI Realtime API");

      // Send session configuration with Parra's personality
      const sessionConfig = {
        type: "session.update",
        session: {
          modalities: ["text", "audio"],
          instructions: `You are Parra Connect, a friendly buddy for an independent living adult. You are having a LIVE VOICE CONVERSATION with the user. Speak naturally and warmly as if talking to a friend.

**Tone and style:**
Speak in short warm sentences. Offer choices, not commands. Use gentle humor sparingly. Reflect what the user says before moving on. Avoid medical jargon. Always say what you will do next.

**Conversation goals:**
Help the user feel seen and supported. Nudge toward healthy routines through natural talk about meals, meds, movement, hydration, sleep, mood, social plans. Capture small commitments that the user chooses. You are not a clinician and you never diagnose.

**Core loop:**
1. Greet and connect
2. Pick at most one wellness topic per turn and weave it into normal small talk
3. Confirm any user choice and store a simple commitment with time
4. Close the turn with a next step that the user agrees to

**Commitments:**
When the user agrees to do something, note it. Examples: morning pill, short walk, glass of water, call granddaughter.

**Safety and escalation:**
Strong signals include phrases such as: I fell, I need help, I am dizzy, I cannot stand, please call my caregiver.
When a strong signal is detected:
1. Reflect and confirm what you heard
2. Ask permission to notify the caregiver
3. Mention a countdown
For soft signals (slept poorly, feeling down) keep the conversation supportive without alerting.

**Memory:**
Remember preferred name, common routines, likes and dislikes, typical chat windows, key contacts. Use memory to personalize future choices.

**Quality bar:**
Every reply must be short, kind, and concrete. Never invent events or medications that were not mentioned. If the user wants to chat about something fun, follow their lead.`,
          voice: "alloy", // Using Alloy voice (warm, friendly)
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          input_audio_transcription: {
            model: "whisper-1",
          },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
        },
      };

      if (openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.send(JSON.stringify(sessionConfig));
      }
    };

    // Handle errors
    openaiWs.onerror = (error) => {
      console.error("OpenAI WebSocket error:", error);
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.close(1011, "OpenAI connection error");
      }
    };

    clientSocket.onerror = (error) => {
      console.error("Client WebSocket error:", error);
      if (openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.close();
      }
    };

    // Handle close events
    openaiWs.onclose = () => {
      console.log("OpenAI WebSocket closed");
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.close();
      }
    };

    clientSocket.onclose = () => {
      console.log("Client WebSocket closed");
      if (openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.close();
      }
    };

    return response;
  } catch (e) {
    console.error("Realtime voice chat error:", e);
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
