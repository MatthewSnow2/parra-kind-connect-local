# Voice Chat Feature - Implementation Plan

## Overview
Enable seniors to have voice conversations with Parra using speech-to-text, LLM processing, and text-to-speech technologies.

## Architecture Options

### Option 1: Browser-Based (Recommended for MVP)
**Pros:** Free, low latency, no additional infrastructure
**Cons:** Browser compatibility issues, less accurate transcription

**Stack:**
- Frontend: Web Speech API (Chrome/Edge/Safari)
- Backend: Existing LLM endpoint
- TTS: Web Speech Synthesis API

**Implementation:**
```typescript
// Frontend component
const VoiceChat = () => {
  const recognition = new webkitSpeechRecognition();
  const synthesis = window.speechSynthesis;

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    // Send to backend LLM
    const response = await sendToLLM(transcript);
    // Speak response
    const utterance = new SpeechSynthesisUtterance(response);
    synthesis.speak(utterance);
  };
};
```

### Option 2: Cloud-Based (Recommended for Production)
**Pros:** Better accuracy, cross-browser support, professional quality
**Cons:** Costs money, requires API integration

**Stack:**
- STT: OpenAI Whisper API (~$0.006/minute) OR Deepgram API (~$0.0043/minute)
- Backend: Existing Supabase Edge Function + LLM
- TTS: ElevenLabs (~$0.30/1K chars) OR OpenAI TTS (~$0.015/1K chars)

## Detailed Implementation Steps

### Phase 1: Frontend Audio Capture
```typescript
// src/components/VoiceRecorder.tsx
import { useState, useRef } from 'react';

export const VoiceRecorder = ({ onTranscript }: { onTranscript: (text: string) => void }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await sendToTranscription(audioBlob);
      audioChunksRef.current = [];
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const sendToTranscription = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    const { transcript } = await response.json();
    onTranscript(transcript);
  };

  return (
    <button onClick={isRecording ? stopRecording : startRecording}>
      {isRecording ? 'Stop' : 'Start'} Recording
    </button>
  );
};
```

### Phase 2: Backend Transcription (Supabase Edge Function)
```typescript
// supabase/functions/transcribe-audio/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const formData = await req.formData();
  const audioFile = formData.get('audio') as File;

  // Option A: OpenAI Whisper
  const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    },
    body: formData,
  });

  const { text } = await whisperResponse.json();

  return new Response(JSON.stringify({ transcript: text }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Phase 3: LLM Processing (Existing)
- Use existing `senior-chat` edge function
- No changes needed - it already handles text input

### Phase 4: Text-to-Speech Response
```typescript
// supabase/functions/text-to-speech/index.ts
serve(async (req) => {
  const { text } = await req.json();

  // Option A: OpenAI TTS
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: 'alloy', // or 'nova', 'shimmer' for female voices
      input: text,
    }),
  });

  const audioBuffer = await response.arrayBuffer();

  return new Response(audioBuffer, {
    headers: { 'Content-Type': 'audio/mpeg' },
  });
});
```

### Phase 5: Frontend Audio Playback
```typescript
const playAudioResponse = async (text: string) => {
  const response = await fetch('/api/text-to-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
};
```

## Cost Analysis

### For 100 minutes of voice chat per day:
- **OpenAI Whisper:** $0.006/min * 100 = $0.60/day = $18/month
- **OpenAI TTS:** ~500 chars/minute * 100 min = 50K chars * $0.015 = $0.75/day = $22.50/month
- **LLM (existing):** Already in place, no additional cost
- **Total:** ~$40.50/month for 100 minutes/day

### Alternative (Cheaper):
- **Deepgram STT:** $0.0043/min * 100 = $0.43/day = $12.90/month
- **Google Cloud TTS:** ~$4/million chars = ~$0.20/day = $6/month
- **Total:** ~$18.90/month for 100 minutes/day

## Implementation Timeline

### Week 1: MVP with Browser APIs
- Day 1-2: Frontend voice recording component
- Day 3-4: Integration with existing LLM endpoint
- Day 5: Browser TTS implementation
- **Deliverable:** Working voice chat in Chrome/Edge browsers

### Week 2: Production-Ready Cloud Version
- Day 1-2: Integrate OpenAI Whisper/Deepgram
- Day 3-4: Integrate cloud TTS (OpenAI/Google)
- Day 5: Testing and optimization
- **Deliverable:** Cross-browser, high-quality voice chat

### Week 3: Polish & Features
- Day 1-2: Add voice activity detection
- Day 3: Add conversation history
- Day 4: Add push-to-talk vs continuous mode
- Day 5: User testing and bug fixes
- **Deliverable:** Production-ready voice chat feature

## Required API Keys

1. **OpenAI** (for Whisper + TTS):
   - Sign up at https://platform.openai.com
   - Add to Supabase Edge Functions secrets:
     ```bash
     supabase secrets set OPENAI_API_KEY=sk-...
     ```

2. **OR Deepgram** (alternative for STT):
   - Sign up at https://deepgram.com
   - Add to secrets:
     ```bash
     supabase secrets set DEEPGRAM_API_KEY=...
     ```

3. **OR Google Cloud** (alternative for TTS):
   - Enable Cloud Text-to-Speech API
   - Add service account credentials

## Security Considerations

1. **Audio data privacy:**
   - Stream audio directly to APIs, don't store on server
   - Use HTTPS for all audio transmission
   - Clear audio buffers after processing

2. **Rate limiting:**
   - Limit voice chat duration per session (e.g., 5 minutes max)
   - Implement cooldown between sessions
   - Monitor API usage to prevent abuse

3. **Content moderation:**
   - Run transcripts through content moderation API
   - Flag inappropriate content
   - Implement emergency stop/report mechanism

## Next Steps

1. **Decision Point:** Choose between Browser-based MVP or Cloud-based production
2. **Get API Keys:** Set up OpenAI/Deepgram/Google Cloud accounts
3. **Create Edge Functions:** Deploy transcription and TTS endpoints
4. **Build Frontend:** Create voice recording UI in SeniorChat.tsx
5. **Test:** Verify latency, quality, and user experience
6. **Deploy:** Push to production and monitor usage/costs
