-- =====================================================
-- FIX ALERTS TABLE - ADD MISSING COLUMNS
-- =====================================================
-- Migration: 20251018000001_fix_alerts_missing_columns.sql
-- Purpose: Add resolved_at, resolved_by, title, and description columns
--          that are referenced by switchbot fall detection functions
--          but were missing from the original schema

-- Add resolved_at and resolved_by columns
-- These are used by process_motion_event() function
ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add title and description columns
-- These are used by check_inactivity_thresholds() function
-- We'll keep alert_message for backward compatibility
ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for resolved_at for performance
CREATE INDEX IF NOT EXISTS idx_alerts_resolved_at ON public.alerts(resolved_at);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON public.alerts(resolved_at) WHERE resolved_at IS NULL;

-- Add comments
COMMENT ON COLUMN public.alerts.resolved_at IS 'Timestamp when the alert was resolved (motion resumed, patient responded, or manually dismissed)';
COMMENT ON COLUMN public.alerts.resolved_by IS 'User ID who resolved the alert (patient or caregiver)';
COMMENT ON COLUMN public.alerts.title IS 'Short title for the alert (e.g., "Motion Inactivity Detected")';
COMMENT ON COLUMN public.alerts.description IS 'Detailed description of the alert';

-- Migration complete
SELECT 'Alerts table missing columns added successfully' as status;
