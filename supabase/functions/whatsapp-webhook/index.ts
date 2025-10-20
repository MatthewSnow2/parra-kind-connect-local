/**
 * WhatsApp Webhook Edge Function
 *
 * Receives incoming WhatsApp messages from Evolution API.
 * Processes voice messages: downloads → transcribes (Whisper) → generates response (GPT-4) → replies
 *
 * @module edge-functions/whatsapp-webhook
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("📱 Received WhatsApp webhook");

    // 1. Parse webhook from Evolution API
    const body = await req.json();
    console.log("Webhook event:", body.event);

    // Evolution API webhook structure:
    // {
    //   "event": "messages.upsert",
    //   "instance": "Parra AI",
    //   "data": {
    //     "key": { "remoteJid": "13039279468@s.whatsapp.net", ... },
    //     "message": {
    //       "audioMessage": {
    //         "url": "https://...",
    //         "mimetype": "audio/ogg; codecs=opus",
    //         "seconds": 5
    //       }
    //     },
    //     "messageType": "audioMessage",
    //     "pushName": "Matthew"
    //   }
    // }

    const { event, data } = body;

    // Only process incoming messages
    if (event !== "messages.upsert") {
      console.log("Not a message event, ignoring");
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Check if it's a voice message
    if (data.messageType !== "audioMessage") {
      console.log(`Message type is ${data.messageType}, not audio - ignoring`);
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Extract sender information
    const senderJid = data.key.remoteJid; // "13039279468@s.whatsapp.net"
    const senderPhone = senderJid.split("@")[0]; // "13039279468"
    const senderName = data.pushName || "Patient";

    console.log(`Voice message from ${senderName} (${senderPhone.substring(0, 5)}***)`);

    // 4. Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      console.error("Missing required environment variables");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 5. Find patient by phone number
    const { data: patient, error: patientError } = await supabase
      .from("profiles")
      .select("id, full_name, whatsapp_phone")
      .eq("whatsapp_phone", senderPhone)
      .eq("role", "patient")
      .single();

    if (patientError || !patient) {
      console.error("Patient not found for phone:", senderPhone);

      // Send a friendly message to unknown number
      await sendWhatsAppReply(
        senderPhone,
        "Hi! I don't recognize this number. Please make sure you're using the phone number registered with your Parra account."
      );

      return new Response(
        JSON.stringify({ error: "Patient not found", phone: senderPhone }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ Found patient: ${patient.full_name}`);

    // 6. Download and transcribe voice message
    const audioUrl = data.message.audioMessage.url;
    const durationSeconds = data.message.audioMessage.seconds || 0;

    console.log(`🎤 Transcribing ${durationSeconds}s voice message...`);
    const transcript = await transcribeAudio(audioUrl, openaiApiKey);
    console.log(`📝 Transcript: "${transcript}"`);

    // 7. Generate intelligent response with GPT-4
    console.log(`🤖 Generating response...`);
    const aiResponse = await generateResponse(
      transcript,
      patient.id,
      patient.full_name,
      openaiApiKey,
      supabase
    );
    console.log(`💬 Response: "${aiResponse}"`);

    // 8. Send reply via Evolution API
    console.log(`📤 Sending WhatsApp reply...`);
    await sendWhatsAppReply(senderPhone, aiResponse);

    // 9. Log conversation to database
    const { error: insertError } = await supabase
      .from("voice_checkins")
      .insert({
        patient_id: patient.id,
        audio_url: audioUrl,
        transcript: transcript,
        ai_response: aiResponse,
        duration_seconds: durationSeconds,
        message_type: "whatsapp_voice",
      });

    if (insertError) {
      console.error("Error logging voice check-in:", insertError);
    } else {
      console.log("✅ Voice check-in logged to database");
    }

    return new Response(
      JSON.stringify({
        success: true,
        patient: patient.full_name,
        transcript: transcript,
        response: aiResponse,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing WhatsApp webhook:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeAudio(
  audioUrl: string,
  openaiApiKey: string
): Promise<string> {
  try {
    // Download audio file from Evolution API
    console.log("Downloading audio from:", audioUrl);
    const audioResponse = await fetch(audioUrl);

    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }

    const audioBlob = await audioResponse.blob();
    console.log(`Audio downloaded: ${audioBlob.size} bytes`);

    // Send to OpenAI Whisper
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.ogg");
    formData.append("model", "whisper-1");
    formData.append("language", "en"); // Helps accuracy

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}

/**
 * Generate response using GPT-4
 */
async function generateResponse(
  transcript: string,
  patientId: string,
  patientName: string,
  openaiApiKey: string,
  supabase: any
): Promise<string> {
  try {
    // Get recent context about patient (last few check-ins, medications, etc.)
    const { data: recentCheckins } = await supabase
      .from("voice_checkins")
      .select("transcript, ai_response, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(3);

    // Build conversation context
    let contextMessages = [];

    if (recentCheckins && recentCheckins.length > 0) {
      contextMessages = recentCheckins.reverse().flatMap((checkin: any) => [
        { role: "user", content: checkin.transcript },
        { role: "assistant", content: checkin.ai_response },
      ]);
    }

    // Call GPT-4
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are Parra, a caring AI assistant for ${patientName}, an elderly person living independently.

Your role:
- Respond warmly and naturally to their voice messages
- Keep responses brief (1-3 sentences max)
- If they mention taking medications, confirm and ask how they're feeling
- If they mention activities (walking, eating, etc.), show interest and encourage them
- If they sound distressed or mention falling/injury, express concern and suggest contacting their caregiver
- Always be supportive, kind, and use a friendly tone
- Use their name occasionally to make it personal

Remember: This is a voice message conversation on WhatsApp, so keep it casual and conversational.`,
          },
          ...contextMessages,
          {
            role: "user",
            content: transcript,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GPT-4 API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    console.error("Error generating response:", error);
    // Fallback response
    return `Hi ${patientName}! Thanks for your message. I'm having a little trouble right now, but I heard you. Is everything okay?`;
  }
}

/**
 * Send WhatsApp reply via Evolution API
 */
async function sendWhatsAppReply(
  phoneNumber: string,
  message: string
): Promise<void> {
  const EVOLUTION_BASE_URL = Deno.env.get("EVOLUTION_BASE_URL");
  const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
  const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE_NAME");

  if (!EVOLUTION_BASE_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
    console.error("Evolution API not configured");
    throw new Error("Evolution API credentials missing");
  }

  const whatsappJid = `${phoneNumber}@s.whatsapp.net`;
  const url = `${EVOLUTION_BASE_URL}/message/sendText/${encodeURIComponent(
    EVOLUTION_INSTANCE
  )}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      number: whatsappJid,
      text: message,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Evolution API error: ${response.status} - ${errorText}`
    );
  }

  const result = await response.json();
  console.log("✅ WhatsApp reply sent:", result.key?.id || "success");
}
