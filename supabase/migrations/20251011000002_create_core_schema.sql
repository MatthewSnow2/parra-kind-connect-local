-- =====================================================
-- PARRA CONNECT - CORE DATABASE SCHEMA
-- =====================================================
-- This migration creates all core tables for the Parra Connect application
-- Run this in Supabase SQL Editor after the waitlist_signups migration

-- =====================================================
-- 1. PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('senior', 'caregiver', 'family_member', 'admin')),
  phone_number TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,

  -- Preferences
  notification_preferences JSONB DEFAULT '{"email": true, "whatsapp": false, "push": true}'::jsonb,
  timezone TEXT DEFAULT 'America/New_York',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- =====================================================
-- 2. CARE_RELATIONSHIPS TABLE (patient-caregiver connections)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.care_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Who is being cared for (senior/patient)
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Who is providing care
  caregiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Relationship details
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('primary_caregiver', 'family_member', 'healthcare_provider', 'friend', 'other')),
  relationship_label TEXT, -- e.g., "Daughter", "Son", "Spouse", "Nurse"

  -- Access permissions
  can_view_health_data BOOLEAN DEFAULT true,
  can_receive_alerts BOOLEAN DEFAULT true,
  can_modify_settings BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  invitation_token TEXT UNIQUE,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate relationships
  UNIQUE(patient_id, caregiver_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_care_relationships_patient ON public.care_relationships(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_relationships_caregiver ON public.care_relationships(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_care_relationships_status ON public.care_relationships(status);

-- RLS Policies
ALTER TABLE public.care_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers can view their relationships"
  ON public.care_relationships FOR SELECT
  TO authenticated
  USING (auth.uid() = caregiver_id OR auth.uid() = patient_id);

-- =====================================================
-- 3. CHECK_INS TABLE (conversation history)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Conversation details
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('voice', 'text', 'whatsapp', 'scheduled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER, -- calculated when ended_at is set

  -- Conversation content (stored as JSONB for flexibility)
  messages JSONB DEFAULT '[]'::jsonb, -- Array of {role, content, timestamp}

  -- AI Analysis
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
  mood_detected TEXT CHECK (mood_detected IN ('happy', 'neutral', 'sad', 'concerned', 'anxious', 'confused')),
  topics_discussed TEXT[], -- e.g., ['medication', 'sleep', 'meals']

  -- Safety flags
  safety_concern_detected BOOLEAN DEFAULT false,
  safety_concern_type TEXT CHECK (safety_concern_type IN ('fall', 'distress', 'medical', 'missed_medication', 'inactivity', 'other')),
  safety_concern_details TEXT,
  alert_sent BOOLEAN DEFAULT false,
  alert_sent_at TIMESTAMPTZ,

  -- Commitments made during conversation
  commitments JSONB DEFAULT '[]'::jsonb, -- Array of {action, time, completed}

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_check_ins_patient ON public.check_ins(patient_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_started_at ON public.check_ins(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_safety_concern ON public.check_ins(safety_concern_detected) WHERE safety_concern_detected = true;

-- RLS Policies
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own check-ins"
  ON public.check_ins FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Caregivers can view their patients' check-ins"
  ON public.check_ins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_relationships
      WHERE patient_id = check_ins.patient_id
      AND caregiver_id = auth.uid()
      AND status = 'active'
      AND can_view_health_data = true
    )
  );

-- =====================================================
-- 4. DAILY_SUMMARIES TABLE (aggregated daily insights)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  summary_date DATE NOT NULL,

  -- Activity metrics
  check_in_count INTEGER DEFAULT 0,
  total_conversation_minutes INTEGER DEFAULT 0,

  -- Wellness indicators
  overall_mood TEXT CHECK (overall_mood IN ('happy', 'neutral', 'sad', 'concerned', 'mixed')),
  average_sentiment_score DECIMAL(3,2),

  -- Compliance tracking
  medication_taken BOOLEAN,
  meals_reported INTEGER DEFAULT 0,
  activity_reported BOOLEAN,
  sleep_quality TEXT CHECK (sleep_quality IN ('good', 'fair', 'poor', 'not_reported')),

  -- Status
  overall_status TEXT NOT NULL DEFAULT 'ok' CHECK (overall_status IN ('ok', 'warning', 'alert')),
  status_reason TEXT,

  -- AI-generated summary
  summary_text TEXT,
  highlights TEXT[],
  concerns TEXT[],

  -- Alert tracking
  alerts_triggered INTEGER DEFAULT 0,
  alert_types TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(patient_id, summary_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_summaries_patient ON public.daily_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON public.daily_summaries(summary_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_status ON public.daily_summaries(overall_status);

-- RLS Policies
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own summaries"
  ON public.daily_summaries FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Caregivers can view their patients' summaries"
  ON public.daily_summaries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_relationships
      WHERE patient_id = daily_summaries.patient_id
      AND caregiver_id = auth.uid()
      AND status = 'active'
    )
  );

-- =====================================================
-- 5. CAREGIVER_NOTES TABLE (notes from caregivers)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.caregiver_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  caregiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  note_type TEXT NOT NULL CHECK (note_type IN ('general', 'medication', 'appointment', 'concern', 'reminder')),
  note_text TEXT NOT NULL,

  -- Scheduling
  reminder_date DATE,
  reminder_time TIME,
  is_reminder BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,

  -- Sharing
  shared_with_patient BOOLEAN DEFAULT false,
  shared_with_care_team BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_caregiver_notes_patient ON public.caregiver_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_notes_caregiver ON public.caregiver_notes(caregiver_id);
CREATE INDEX IF NOT EXISTS idx_caregiver_notes_reminder ON public.caregiver_notes(reminder_date) WHERE is_reminder = true;

-- RLS Policies
ALTER TABLE public.caregiver_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caregivers can manage their own notes"
  ON public.caregiver_notes FOR ALL
  TO authenticated
  USING (auth.uid() = caregiver_id);

CREATE POLICY "Patients can view notes shared with them"
  ON public.caregiver_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id AND shared_with_patient = true);

-- =====================================================
-- 6. ALERTS TABLE (safety alerts and notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  check_in_id UUID REFERENCES public.check_ins(id) ON DELETE SET NULL,

  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN ('fall_detected', 'distress_signal', 'missed_checkin', 'medication_missed', 'prolonged_inactivity', 'health_concern', 'manual')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  alert_message TEXT NOT NULL,
  alert_details JSONB,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_alarm')),

  -- Notification tracking
  notified_caregivers UUID[] DEFAULT ARRAY[]::UUID[],
  notification_sent_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  resolution_notes TEXT,

  -- Escalation
  escalation_countdown_started BOOLEAN DEFAULT false,
  escalation_countdown_end TIMESTAMPTZ,
  escalated BOOLEAN DEFAULT false,
  escalated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alerts_patient ON public.alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at DESC);

-- RLS Policies
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view their own alerts"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Caregivers can view and acknowledge their patients' alerts"
  ON public.alerts FOR ALL
  TO authenticated
  USING (
    auth.uid() = patient_id OR
    EXISTS (
      SELECT 1 FROM public.care_relationships
      WHERE patient_id = alerts.patient_id
      AND caregiver_id = auth.uid()
      AND status = 'active'
      AND can_receive_alerts = true
    )
  );

-- =====================================================
-- 7. ACTIVITY_LOG TABLE (system activity tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'profile_update', 'check_in', 'alert_sent', 'alert_acknowledged', 'note_created', 'settings_changed', 'export_data')),
  activity_description TEXT,
  activity_metadata JSONB,

  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_activity_type ON public.activity_log(activity_type);

-- RLS Policies
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity"
  ON public.activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_care_relationships_updated_at
  BEFORE UPDATE ON public.care_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_check_ins_updated_at
  BEFORE UPDATE ON public.check_ins
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_daily_summaries_updated_at
  BEFORE UPDATE ON public.daily_summaries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_caregiver_notes_updated_at
  BEFORE UPDATE ON public.caregiver_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users with additional fields';
COMMENT ON TABLE public.care_relationships IS 'Links patients with their caregivers and family members';
COMMENT ON TABLE public.check_ins IS 'Stores conversation history and AI analysis from check-ins';
COMMENT ON TABLE public.daily_summaries IS 'Aggregated daily wellness summaries for each patient';
COMMENT ON TABLE public.caregiver_notes IS 'Notes and reminders created by caregivers';
COMMENT ON TABLE public.alerts IS 'Safety alerts and notifications with escalation tracking';
COMMENT ON TABLE public.activity_log IS 'Audit log of user activities and system events';

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate check-in duration when ended
CREATE OR REPLACE FUNCTION calculate_check_in_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_check_in_duration
  BEFORE INSERT OR UPDATE OF ended_at ON public.check_ins
  FOR EACH ROW
  EXECUTE FUNCTION calculate_check_in_duration();

-- Function to automatically create daily summary when check-in is completed
CREATE OR REPLACE FUNCTION update_daily_summary_on_check_in()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update daily summary for the check-in date
  INSERT INTO public.daily_summaries (
    patient_id,
    summary_date,
    check_in_count,
    total_conversation_minutes,
    overall_mood,
    average_sentiment_score
  )
  VALUES (
    NEW.patient_id,
    DATE(NEW.started_at),
    1,
    COALESCE(NEW.duration_seconds / 60, 0),
    NEW.mood_detected,
    NEW.sentiment_score
  )
  ON CONFLICT (patient_id, summary_date)
  DO UPDATE SET
    check_in_count = daily_summaries.check_in_count + 1,
    total_conversation_minutes = daily_summaries.total_conversation_minutes + COALESCE(NEW.duration_seconds / 60, 0),
    overall_mood = CASE
      WHEN NEW.mood_detected IN ('sad', 'concerned', 'anxious') THEN NEW.mood_detected
      ELSE daily_summaries.overall_mood
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_daily_summary_after_check_in
  AFTER INSERT OR UPDATE OF ended_at ON public.check_ins
  FOR EACH ROW
  WHEN (NEW.ended_at IS NOT NULL)
  EXECUTE FUNCTION update_daily_summary_on_check_in();
