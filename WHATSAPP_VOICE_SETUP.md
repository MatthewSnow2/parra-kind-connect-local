# WhatsApp Voice Integration Setup Guide

## Architecture Overview

```
Senior sends voice message → Evolution API → Your Supabase Edge Function → Whisper (transcribe) → GPT-4 (respond) → Evolution API → Senior receives reply
```

---

## Division of Responsibilities

### Zak's Side (Evolution API Configuration)

1. **Configure Webhook in Evolution API Dashboard**
```bash
POST {EVOLUTION_BASE_URL}/webhook/set/Parra%20AI
Headers:
  apikey: {EVOLUTION_API_KEY}
  Content-Type: application/json

Body:
{
  "url": "https://xoygyimwkmepwjqmnfxh.supabase.co/functions/v1/whatsapp-webhook",
  "webhook_by_events": true,
  "events": [
    "messages.upsert"
  ],
  "webhook_base64": true
}
```

2. **Ensure Instance is Connected to WhatsApp**
   - Evolution instance "Parra AI" must be connected to a WhatsApp number
   - QR code scanned and active

3. **Test Webhook Delivery**
   - Send test message to verify webhook fires
   - Provide webhook logs if issues occur

### Your Side (Supabase Edge Function + OpenAI)

**Everything below is what YOU would implement:**

---

## Do You Need Both Whisper and GPT-4?

### Short Answer: **Technically No, but Practically Yes**

**What Each Does:**

1. **Whisper** = Speech-to-Text
   - Converts voice audio file → text transcript
   - Example: Audio "Hey Parra, I took my medications" → Text "Hey Parra, I took my medications"
   - Cost: $0.006 per minute of audio

2. **GPT-4** = Text Understanding + Response Generation
   - Takes transcript → generates intelligent, context-aware response
   - Example: Text "Hey Parra, I took my medications" → Response "Great! I've logged your medications at 2:30 PM. How are you feeling today?"
   - Cost: ~$0.01 per conversation

**Could you skip GPT-4?**
- Yes, with keyword matching:
  ```typescript
  if (transcript.includes("medication") || transcript.includes("meds")) {
    return "Medication logged. Thank you!";
  }
  ```
- But this is rigid and not conversational
- Seniors would notice it's not "smart"

**Recommendation:** Use both for natural conversation

---

## Whisper Setup (Your Side)

### Good News: **NO Setup Required** ✅

Whisper is just an API endpoint. You already have the OpenAI API key set up in your environment.

**What you need:**
1. OpenAI API Key (you already have this - same one used for chat)
2. That's it!

### How to Use Whisper

**Single API Call:**

```typescript
async function transcribeVoiceMessage(audioUrl: string): Promise<string> {
  // 1. Download audio file from Evolution API
  const audioResponse = await fetch(audioUrl);
  const audioBlob = await audioResponse.blob();

  // 2. Send to OpenAI Whisper
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.ogg');
  formData.append('model', 'whisper-1');
  formData.append('language', 'en'); // Optional: helps accuracy

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`, // Same key as GPT-4
    },
    body: formData,
  });

  const result = await response.json();
  return result.text; // "Hey Parra, I took my medications"
}
```

**That's the entire setup for Whisper!** No configuration, no account setup, no special permissions.

---

## Complete Implementation (Your Edge Function)

### File: `supabase/functions/whatsapp-webhook/index.ts`

```typescript
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
    // 1. Receive webhook from Evolution API
    const body = await req.json();
    console.log("📱 Received WhatsApp webhook:", body);

    // Evolution API webhook structure:
    // {
    //   "event": "messages.upsert",
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

    const { data } = body;

    // 2. Check if it's a voice message
    if (data.messageType !== "audioMessage") {
      console.log("Not a voice message, ignoring");
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Extract sender phone number
    const senderJid = data.key.remoteJid; // "13039279468@s.whatsapp.net"
    const senderPhone = senderJid.split("@")[0]; // "13039279468"

    // 4. Find patient by phone number
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: patient, error: patientError } = await supabase
      .from("profiles")
      .select("id, full_name, whatsapp_phone")
      .eq("whatsapp_phone", senderPhone)
      .eq("role", "patient")
      .single();

    if (patientError || !patient) {
      console.error("Patient not found for phone:", senderPhone);
      return new Response(JSON.stringify({ error: "Patient not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Download and transcribe voice message
    const audioUrl = data.message.audioMessage.url;
    const transcript = await transcribeAudio(audioUrl);
    console.log("📝 Transcript:", transcript);

    // 6. Generate intelligent response with GPT-4
    const response = await generateResponse(transcript, patient.id, patient.full_name);
    console.log("🤖 Response:", response);

    // 7. Send reply via Evolution API
    await sendWhatsAppReply(senderPhone, response);

    // 8. Log conversation to database
    await supabase.from("voice_checkins").insert({
      patient_id: patient.id,
      audio_url: audioUrl,
      transcript: transcript,
      ai_response: response,
      created_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error processing WhatsApp webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

async function transcribeAudio(audioUrl: string): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  // Download audio file
  const audioResponse = await fetch(audioUrl);
  const audioBlob = await audioResponse.blob();

  // Send to Whisper
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.ogg');
  formData.append('model', 'whisper-1');
  formData.append('language', 'en');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  const result = await response.json();
  return result.text;
}

async function generateResponse(
  transcript: string,
  patientId: string,
  patientName: string
): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  // Get patient context (recent activities, medications, etc.)
  // For now, simple response

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are Parra, a caring AI assistant for ${patientName}.
          Respond warmly and naturally to their voice message. Keep responses brief (1-2 sentences).
          If they mention medications, confirm and ask how they're feeling.
          If they mention activities, show interest and encourage them.
          Always be supportive and kind.`
        },
        {
          role: 'user',
          content: transcript
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
    }),
  });

  const result = await response.json();
  return result.choices[0].message.content;
}

async function sendWhatsAppReply(phoneNumber: string, message: string): Promise<void> {
  const EVOLUTION_BASE_URL = Deno.env.get("EVOLUTION_BASE_URL");
  const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
  const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE_NAME");

  const whatsappJid = `${phoneNumber}@s.whatsapp.net`;
  const url = `${EVOLUTION_BASE_URL}/message/sendText/${encodeURIComponent(EVOLUTION_INSTANCE)}`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      number: whatsappJid,
      text: message,
    }),
  });
}
```

---

## Database Schema Addition

### New Table: `voice_checkins`

```sql
CREATE TABLE voice_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  transcript TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voice_checkins_patient ON voice_checkins(patient_id);
CREATE INDEX idx_voice_checkins_created ON voice_checkins(created_at DESC);
```

---

## Environment Variables Needed

**Already Have:**
- `OPENAI_API_KEY` ✅ (for both Whisper AND GPT-4)
- `EVOLUTION_BASE_URL` ✅
- `EVOLUTION_API_KEY` ✅
- `EVOLUTION_INSTANCE_NAME` ✅

**No New Variables Needed!** ✅

---

## Cost Breakdown

**Per Voice Message:**
- Whisper transcription (avg 10 seconds): $0.001
- GPT-4 response (100 tokens): $0.003
- Evolution API: FREE (self-hosted)
- **Total: ~$0.004 per voice message**

**100 voice messages/day:**
- Daily: $0.40
- Monthly: $12
- **Very affordable for capstone demo!**

---

## Testing Steps

1. **Deploy Edge Function:**
```bash
supabase functions deploy whatsapp-webhook
```

2. **Zak Configures Webhook:**
   - Points Evolution API to your function URL
   - Tests webhook delivery

3. **Send Test Voice Message:**
   - You send WhatsApp voice message to Parra number
   - Check logs: `supabase functions logs whatsapp-webhook`
   - Verify response received

4. **Verify Database:**
```sql
SELECT * FROM voice_checkins ORDER BY created_at DESC LIMIT 5;
```

---

## Implementation Time Estimate

**Your Side:**
- Edge Function: 2 hours
- Database migration: 30 minutes
- Testing: 1 hour
- **Total: 3.5 hours**

**Zak's Side:**
- Webhook configuration: 15 minutes
- Testing: 15 minutes
- **Total: 30 minutes**

**Grand Total: 4 hours** (well within your 12-hour window if you decide to implement)

---

## Alternative: Document-Only (For Capstone)

If you don't have time to implement, you can:

1. **Add to documentation:**
   - "Voice Check-ins (Coming Soon)" section in README
   - Architecture diagram in PARRA_BUILD_JOURNEY.md
   - Show this setup guide to judges

2. **Mention in presentation:**
   - "Phase 2 roadmap includes WhatsApp voice integration"
   - Show cost analysis ($0.004 per message vs. alternatives)
   - Demonstrate technical planning

This shows forward-thinking without rushing implementation.

---

## Recommendation

Given you have 12 hours left:

**Option A: Implement Now** (if Zak is available)
- Real working feature for demo
- Impressive "wow factor"
- Risk: debugging if issues arise

**Option B: Document Thoroughly** (safer)
- Focus on polishing existing features
- Include detailed implementation plan
- Shows technical depth without execution risk

What would you prefer?
