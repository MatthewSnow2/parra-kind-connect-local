/**
 * Voice Chat Edge Function
 *
 * Handles voice conversations using OpenAI pipeline:
 * 1. Whisper API (speech-to-text)
 * 2. GPT-4 (conversation)
 * 3. TTS API (text-to-speech)
 *
 * This replaces the problematic Realtime API with a proven, reliable approach.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // Get OpenAI API key
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const conversationHistory = formData.get('history');

    if (!audioFile) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🎤 Processing voice input from user:', user.id);
    console.log('📊 Audio file size:', audioFile.size, 'bytes');

    // Parse conversation history
    let messages = [];
    if (conversationHistory) {
      try {
        messages = JSON.parse(conversationHistory as string);
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }

    // Step 1: Transcribe audio with Whisper
    console.log('🔊 Transcribing audio with Whisper...');
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-1');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: whisperFormData,
    });

    if (!whisperResponse.ok) {
      const error = await whisperResponse.text();
      console.error('Whisper API error:', error);
      throw new Error(`Whisper transcription failed: ${error}`);
    }

    const { text: transcript } = await whisperResponse.json();
    console.log('📝 Transcript:', transcript);

    // Step 2: Get GPT-4 response
    console.log('🤖 Getting GPT-4 response...');

    // Build conversation with Parra's personality
    const systemMessage = {
      role: 'system',
      content: `You are Parra, a friendly and supportive companion for seniors.

Your personality:
- Warm, caring, and patient
- Speaks in short, clear sentences
- Uses simple language
- Shows genuine interest in the senior's wellbeing
- Occasionally uses gentle humor
- Asks follow-up questions to keep conversation flowing
- Remembers context from earlier in the conversation

Topics you help with:
- Daily wellness check-ins
- Medication reminders
- Meal planning and nutrition
- Exercise and activity suggestions
- Social connection and emotional support
- Memory and cognitive exercises
- Entertainment recommendations

Important:
- Keep responses concise (2-3 sentences max)
- Be encouraging and positive
- Validate their feelings
- Offer help proactively
- If they seem distressed, suggest contacting their caregiver`
    };

    const userMessage = {
      role: 'user',
      content: transcript
    };

    const chatMessages = [
      systemMessage,
      ...messages,
      userMessage
    ];

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: chatMessages,
        temperature: 0.8,
        max_tokens: 150, // Keep responses concise
      }),
    });

    if (!gptResponse.ok) {
      const error = await gptResponse.text();
      console.error('GPT-4 API error:', error);
      throw new Error(`GPT-4 failed: ${error}`);
    }

    const gptData = await gptResponse.json();
    const responseText = gptData.choices[0].message.content;
    console.log('💬 Parra says:', responseText);

    // Step 3: Convert response to speech with TTS
    console.log('🔊 Converting to speech with TTS...');
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'nova', // Warm female voice for Parra
        input: responseText,
        speed: 0.95, // Slightly slower for seniors
      }),
    });

    if (!ttsResponse.ok) {
      const error = await ttsResponse.text();
      console.error('TTS API error:', error);
      throw new Error(`TTS failed: ${error}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    console.log('✅ Voice chat completed successfully');
    console.log('📊 Response audio size:', audioBuffer.byteLength, 'bytes');

    // Return both transcript and audio
    return new Response(
      JSON.stringify({
        transcript,
        responseText,
        audio: Array.from(new Uint8Array(audioBuffer)),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('❌ Voice chat error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
