-- Voice Check-ins Table
-- Stores WhatsApp voice message interactions with patients

CREATE TABLE IF NOT EXISTS public.voice_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Audio and transcription
  audio_url TEXT NOT NULL,
  transcript TEXT NOT NULL,

  -- AI response
  ai_response TEXT NOT NULL,

  -- Metadata
  duration_seconds INTEGER,
  message_type TEXT DEFAULT 'whatsapp_voice', -- 'whatsapp_voice', 'whatsapp_text', 'phone_call'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_checkins_patient ON public.voice_checkins(patient_id);
CREATE INDEX IF NOT EXISTS idx_voice_checkins_created ON public.voice_checkins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_checkins_patient_created ON public.voice_checkins(patient_id, created_at DESC);

-- RLS Policies
ALTER TABLE public.voice_checkins ENABLE ROW LEVEL SECURITY;

-- Patients can view their own voice check-ins
CREATE POLICY "Patients can view own voice check-ins"
  ON public.voice_checkins
  FOR SELECT
  USING (
    auth.uid() = patient_id
  );

-- Caregivers can view voice check-ins of their patients
CREATE POLICY "Caregivers can view patient voice check-ins"
  ON public.voice_checkins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.care_relationships
      WHERE care_relationships.patient_id = voice_checkins.patient_id
        AND care_relationships.caregiver_id = auth.uid()
        AND care_relationships.status = 'active'
    )
  );

-- Service role can insert (for Edge Function)
CREATE POLICY "Service can insert voice check-ins"
  ON public.voice_checkins
  FOR INSERT
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE public.voice_checkins IS 'Stores WhatsApp voice message check-ins from patients';
COMMENT ON COLUMN public.voice_checkins.audio_url IS 'URL to the voice message audio file from Evolution API';
COMMENT ON COLUMN public.voice_checkins.transcript IS 'Whisper API transcription of the voice message';
COMMENT ON COLUMN public.voice_checkins.ai_response IS 'GPT-4 generated response sent back to patient';
