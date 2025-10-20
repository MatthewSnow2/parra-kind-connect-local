-- SwitchBot Motion Sensor Fall Detection Integration
-- Migration: 20251017000003_switchbot_fall_detection.sql
-- Purpose: Add motion sensor tracking, fall detection, and escalation protocol

-- =====================================================
-- PART 1: CORE TABLES
-- =====================================================

-- Table: switchbot_devices
-- Stores registered SwitchBot Motion Sensors
CREATE TABLE IF NOT EXISTS public.switchbot_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    device_mac TEXT NOT NULL UNIQUE, -- MAC address from SwitchBot API
    device_name TEXT NOT NULL, -- User-friendly name (e.g., "Bathroom Sensor")
    device_type TEXT DEFAULT 'WoPresence' CHECK (device_type = 'WoPresence'),
    location TEXT, -- Room/area (e.g., "Bathroom", "Bedroom", "Living Room")
    is_active BOOLEAN DEFAULT true,
    sensitivity_seconds INTEGER DEFAULT 30 CHECK (sensitivity_seconds BETWEEN 10 AND 300), -- Inactivity threshold
    escalation_minutes INTEGER DEFAULT 10 CHECK (escalation_minutes BETWEEN 5 AND 60), -- Time before escalation
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_event_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for switchbot_devices
CREATE INDEX idx_switchbot_devices_patient_id ON public.switchbot_devices(patient_id);
CREATE INDEX idx_switchbot_devices_device_mac ON public.switchbot_devices(device_mac);
CREATE INDEX idx_switchbot_devices_active ON public.switchbot_devices(is_active) WHERE is_active = true;

-- RLS for switchbot_devices
ALTER TABLE public.switchbot_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all switchbot devices"
    ON public.switchbot_devices FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    ));

CREATE POLICY "Patients can view their own devices"
    ON public.switchbot_devices FOR SELECT
    USING (patient_id = auth.uid());

CREATE POLICY "Caregivers can view devices of their patients"
    ON public.switchbot_devices FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.care_relationships cr
        WHERE cr.patient_id = switchbot_devices.patient_id
        AND cr.caregiver_id = auth.uid()
        AND cr.status = 'active'
        AND cr.can_view_health_data = true
    ));

-- Table: motion_sensor_events
-- Stores all motion detection events from SwitchBot webhook
CREATE TABLE IF NOT EXISTS public.motion_sensor_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.switchbot_devices(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('changeReport')),
    detection_state TEXT NOT NULL CHECK (detection_state IN ('DETECTED', 'NOT_DETECTED')),
    time_of_sample BIGINT NOT NULL, -- Unix timestamp from SwitchBot
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    device_mac TEXT NOT NULL,
    raw_payload JSONB, -- Full webhook payload for debugging
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for motion_sensor_events
CREATE INDEX idx_motion_events_device_id ON public.motion_sensor_events(device_id);
CREATE INDEX idx_motion_events_patient_id ON public.motion_sensor_events(patient_id);
CREATE INDEX idx_motion_events_detection_state ON public.motion_sensor_events(detection_state);
CREATE INDEX idx_motion_events_time_of_sample ON public.motion_sensor_events(time_of_sample DESC);
CREATE INDEX idx_motion_events_recorded_at ON public.motion_sensor_events(recorded_at DESC);
CREATE INDEX idx_motion_events_unprocessed ON public.motion_sensor_events(processed) WHERE processed = false;

-- RLS for motion_sensor_events
ALTER TABLE public.motion_sensor_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all motion events"
    ON public.motion_sensor_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    ));

CREATE POLICY "Patients can view their own motion events"
    ON public.motion_sensor_events FOR SELECT
    USING (patient_id = auth.uid());

CREATE POLICY "Caregivers can view motion events of their patients"
    ON public.motion_sensor_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.care_relationships cr
        WHERE cr.patient_id = motion_sensor_events.patient_id
        AND cr.caregiver_id = auth.uid()
        AND cr.status = 'active'
        AND cr.can_view_health_data = true
    ));

-- Table: inactivity_monitoring
-- Tracks ongoing inactivity periods and escalation countdowns
CREATE TABLE IF NOT EXISTS public.inactivity_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES public.switchbot_devices(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    inactivity_started_at TIMESTAMPTZ NOT NULL,
    inactivity_threshold_seconds INTEGER NOT NULL,
    escalation_threshold_minutes INTEGER NOT NULL,
    alert_created_at TIMESTAMPTZ, -- When initial alert was created
    check_in_sent_at TIMESTAMPTZ, -- When check-in message was sent to patient
    check_in_response_at TIMESTAMPTZ, -- When patient responded (NULL = no response)
    escalation_sent_at TIMESTAMPTZ, -- When escalation alert sent to caregivers
    resolved_at TIMESTAMPTZ, -- When motion resumed or manually resolved
    status TEXT NOT NULL DEFAULT 'monitoring' CHECK (status IN ('monitoring', 'check_in_sent', 'escalated', 'resolved', 'false_alarm')),
    resolution_method TEXT CHECK (resolution_method IN ('motion_resumed', 'patient_response', 'caregiver_dismissed', 'admin_dismissed')),
    related_alert_id UUID REFERENCES public.alerts(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for inactivity_monitoring
CREATE INDEX idx_inactivity_monitoring_device_id ON public.inactivity_monitoring(device_id);
CREATE INDEX idx_inactivity_monitoring_patient_id ON public.inactivity_monitoring(patient_id);
CREATE INDEX idx_inactivity_monitoring_status ON public.inactivity_monitoring(status);
CREATE INDEX idx_inactivity_monitoring_unresolved ON public.inactivity_monitoring(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_inactivity_monitoring_check_in_pending ON public.inactivity_monitoring(check_in_sent_at, check_in_response_at)
    WHERE check_in_sent_at IS NOT NULL AND check_in_response_at IS NULL;

-- RLS for inactivity_monitoring
ALTER TABLE public.inactivity_monitoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all inactivity monitoring"
    ON public.inactivity_monitoring FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    ));

CREATE POLICY "Patients can view their own inactivity monitoring"
    ON public.inactivity_monitoring FOR SELECT
    USING (patient_id = auth.uid());

CREATE POLICY "Caregivers can view inactivity monitoring of their patients"
    ON public.inactivity_monitoring FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.care_relationships cr
        WHERE cr.patient_id = inactivity_monitoring.patient_id
        AND cr.caregiver_id = auth.uid()
        AND cr.status = 'active'
    ));

-- =====================================================
-- PART 2: EXTEND EXISTING TABLES
-- =====================================================

-- Add WhatsApp phone number to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_verified_at TIMESTAMPTZ;

-- Create index for WhatsApp lookups
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_phone ON public.profiles(whatsapp_phone) WHERE whatsapp_phone IS NOT NULL;

-- Add new alert types to alerts table (check if alert_type is an enum or text)
-- Assuming alert_type needs extension - adjust based on existing schema
DO $$
BEGIN
    -- Add new alert types if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'alert_type_enum'
        AND e.enumlabel = 'motion_inactivity_detected'
    ) THEN
        ALTER TYPE alert_type_enum ADD VALUE 'motion_inactivity_detected';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'alert_type_enum'
        AND e.enumlabel = 'fall_check_in_needed'
    ) THEN
        ALTER TYPE alert_type_enum ADD VALUE 'fall_check_in_needed';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'alert_type_enum'
        AND e.enumlabel = 'fall_escalation_required'
    ) THEN
        ALTER TYPE alert_type_enum ADD VALUE 'fall_escalation_required';
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- If alert_type is TEXT not ENUM, do nothing
        NULL;
END$$;

-- Add reference to motion sensor device in alerts
ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS motion_device_id UUID REFERENCES public.switchbot_devices(id),
ADD COLUMN IF NOT EXISTS inactivity_monitoring_id UUID REFERENCES public.inactivity_monitoring(id);

-- =====================================================
-- PART 3: DATABASE FUNCTIONS
-- =====================================================

-- Function: process_motion_event
-- Called by switchbot-webhook Edge Function to process incoming motion events
CREATE OR REPLACE FUNCTION public.process_motion_event(
    p_device_mac TEXT,
    p_detection_state TEXT,
    p_time_of_sample BIGINT,
    p_raw_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_device_id UUID;
    v_patient_id UUID;
    v_event_id UUID;
    v_sensitivity_seconds INTEGER;
    v_escalation_minutes INTEGER;
    v_last_event_state TEXT;
    v_inactivity_start TIMESTAMPTZ;
    v_monitoring_id UUID;
    v_alert_id UUID;
    v_result JSONB;
BEGIN
    -- Get device info
    SELECT id, patient_id, sensitivity_seconds, escalation_minutes
    INTO v_device_id, v_patient_id, v_sensitivity_seconds, v_escalation_minutes
    FROM public.switchbot_devices
    WHERE device_mac = p_device_mac
    AND is_active = true;

    IF v_device_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Device not found or inactive',
            'device_mac', p_device_mac
        );
    END IF;

    -- Insert motion event
    INSERT INTO public.motion_sensor_events (
        device_id,
        patient_id,
        event_type,
        detection_state,
        time_of_sample,
        device_mac,
        raw_payload,
        recorded_at
    ) VALUES (
        v_device_id,
        v_patient_id,
        'changeReport',
        p_detection_state,
        p_time_of_sample,
        p_device_mac,
        p_raw_payload,
        NOW()
    )
    RETURNING id INTO v_event_id;

    -- Update last event time on device
    UPDATE public.switchbot_devices
    SET last_event_at = NOW(),
        updated_at = NOW()
    WHERE id = v_device_id;

    -- Handle detection state changes
    IF p_detection_state = 'DETECTED' THEN
        -- Motion detected - resolve any active inactivity monitoring
        UPDATE public.inactivity_monitoring
        SET resolved_at = NOW(),
            status = 'resolved',
            resolution_method = 'motion_resumed',
            updated_at = NOW()
        WHERE device_id = v_device_id
        AND resolved_at IS NULL;

        -- Resolve related alerts
        UPDATE public.alerts
        SET resolved_at = NOW(),
            resolved_by = v_patient_id,
            resolution_notes = 'Motion resumed - automatic resolution'
        WHERE motion_device_id = v_device_id
        AND resolved_at IS NULL
        AND alert_type IN ('motion_inactivity_detected', 'fall_check_in_needed', 'fall_escalation_required');

        v_result := jsonb_build_object(
            'success', true,
            'action', 'motion_detected',
            'inactivity_resolved', true,
            'event_id', v_event_id
        );

    ELSIF p_detection_state = 'NOT_DETECTED' THEN
        -- No motion - check if we should start monitoring
        -- Only start new monitoring if there's no active monitoring for this device
        SELECT id INTO v_monitoring_id
        FROM public.inactivity_monitoring
        WHERE device_id = v_device_id
        AND resolved_at IS NULL
        LIMIT 1;

        IF v_monitoring_id IS NULL THEN
            -- Start new inactivity monitoring
            INSERT INTO public.inactivity_monitoring (
                device_id,
                patient_id,
                inactivity_started_at,
                inactivity_threshold_seconds,
                escalation_threshold_minutes,
                status
            ) VALUES (
                v_device_id,
                v_patient_id,
                NOW(),
                v_sensitivity_seconds,
                v_escalation_minutes,
                'monitoring'
            )
            RETURNING id INTO v_monitoring_id;

            v_result := jsonb_build_object(
                'success', true,
                'action', 'inactivity_monitoring_started',
                'monitoring_id', v_monitoring_id,
                'threshold_seconds', v_sensitivity_seconds,
                'event_id', v_event_id
            );
        ELSE
            v_result := jsonb_build_object(
                'success', true,
                'action', 'inactivity_monitoring_ongoing',
                'monitoring_id', v_monitoring_id,
                'event_id', v_event_id
            );
        END IF;
    END IF;

    RETURN v_result;
END;
$$;

-- Function: check_inactivity_thresholds
-- Called periodically (every 10 seconds via Edge Function cron) to check for threshold breaches
CREATE OR REPLACE FUNCTION public.check_inactivity_thresholds()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_monitoring_record RECORD;
    v_alert_id UUID;
    v_escalation_alert_id UUID;
    v_patient_record RECORD;
    v_device_record RECORD;
    v_alerts_created INTEGER := 0;
    v_escalations_sent INTEGER := 0;
    v_check_ins_sent INTEGER := 0;
BEGIN
    -- Check all active monitoring records
    FOR v_monitoring_record IN
        SELECT
            im.*,
            sd.device_name,
            sd.location,
            p.id as patient_id,
            p.first_name,
            p.last_name,
            p.whatsapp_phone,
            EXTRACT(EPOCH FROM (NOW() - im.inactivity_started_at)) as seconds_inactive,
            EXTRACT(EPOCH FROM (NOW() - im.check_in_sent_at)) / 60 as minutes_since_check_in
        FROM public.inactivity_monitoring im
        JOIN public.switchbot_devices sd ON im.device_id = sd.id
        JOIN public.profiles p ON im.patient_id = p.id
        WHERE im.resolved_at IS NULL
        AND sd.is_active = true
    LOOP
        -- Check if inactivity threshold reached and no alert created yet
        IF v_monitoring_record.seconds_inactive >= v_monitoring_record.inactivity_threshold_seconds
           AND v_monitoring_record.alert_created_at IS NULL THEN

            -- Create initial inactivity alert
            INSERT INTO public.alerts (
                patient_id,
                alert_type,
                severity,
                title,
                description,
                motion_device_id,
                inactivity_monitoring_id,
                requires_acknowledgment,
                escalation_countdown_minutes
            ) VALUES (
                v_monitoring_record.patient_id,
                'motion_inactivity_detected',
                'medium',
                'Motion Inactivity Detected',
                format('No motion detected in %s for %s seconds. Initiating check-in protocol.',
                    v_monitoring_record.location,
                    v_monitoring_record.inactivity_threshold_seconds),
                v_monitoring_record.device_id,
                v_monitoring_record.id,
                true,
                v_monitoring_record.escalation_threshold_minutes
            )
            RETURNING id INTO v_alert_id;

            -- Update monitoring record
            UPDATE public.inactivity_monitoring
            SET alert_created_at = NOW(),
                check_in_sent_at = NOW(),
                status = 'check_in_sent',
                related_alert_id = v_alert_id,
                updated_at = NOW()
            WHERE id = v_monitoring_record.id;

            v_alerts_created := v_alerts_created + 1;
            v_check_ins_sent := v_check_ins_sent + 1;

            -- NOTE: WhatsApp check-in message will be sent by send-whatsapp-notification Edge Function
            -- which monitors the alerts table for new motion_inactivity_detected alerts

        END IF;

        -- Check if escalation threshold reached (no response after check-in)
        IF v_monitoring_record.check_in_sent_at IS NOT NULL
           AND v_monitoring_record.check_in_response_at IS NULL
           AND v_monitoring_record.escalation_sent_at IS NULL
           AND v_monitoring_record.minutes_since_check_in >= v_monitoring_record.escalation_threshold_minutes THEN

            -- Create escalation alert
            INSERT INTO public.alerts (
                patient_id,
                alert_type,
                severity,
                title,
                description,
                motion_device_id,
                inactivity_monitoring_id,
                requires_acknowledgment
            ) VALUES (
                v_monitoring_record.patient_id,
                'fall_escalation_required',
                'critical',
                'URGENT: No Response to Fall Detection Check-In',
                format('%s %s has not responded to check-in after %s minutes of inactivity in %s. Immediate attention required.',
                    v_monitoring_record.first_name,
                    v_monitoring_record.last_name,
                    v_monitoring_record.escalation_threshold_minutes,
                    v_monitoring_record.location),
                v_monitoring_record.device_id,
                v_monitoring_record.id,
                true
            )
            RETURNING id INTO v_escalation_alert_id;

            -- Update monitoring record
            UPDATE public.inactivity_monitoring
            SET escalation_sent_at = NOW(),
                status = 'escalated',
                updated_at = NOW()
            WHERE id = v_monitoring_record.id;

            v_escalations_sent := v_escalations_sent + 1;

            -- NOTE: WhatsApp escalation message to caregivers will be sent by
            -- send-whatsapp-notification Edge Function monitoring fall_escalation_required alerts

        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'alerts_created', v_alerts_created,
        'check_ins_sent', v_check_ins_sent,
        'escalations_sent', v_escalations_sent,
        'checked_at', NOW()
    );
END;
$$;

-- Function: record_patient_response
-- Called when patient responds to check-in (via WhatsApp or app)
CREATE OR REPLACE FUNCTION public.record_patient_response(
    p_patient_id UUID,
    p_response_text TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_monitoring_id UUID;
    v_alert_id UUID;
BEGIN
    -- Find active inactivity monitoring for this patient
    SELECT id, related_alert_id
    INTO v_monitoring_id, v_alert_id
    FROM public.inactivity_monitoring
    WHERE patient_id = p_patient_id
    AND resolved_at IS NULL
    AND check_in_sent_at IS NOT NULL
    AND check_in_response_at IS NULL
    ORDER BY inactivity_started_at DESC
    LIMIT 1;

    IF v_monitoring_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No active check-in found for patient'
        );
    END IF;

    -- Record response
    UPDATE public.inactivity_monitoring
    SET check_in_response_at = NOW(),
        resolved_at = NOW(),
        status = 'resolved',
        resolution_method = 'patient_response',
        updated_at = NOW()
    WHERE id = v_monitoring_id;

    -- Resolve alert
    IF v_alert_id IS NOT NULL THEN
        UPDATE public.alerts
        SET resolved_at = NOW(),
            resolved_by = p_patient_id,
            resolution_notes = COALESCE('Patient responded: ' || p_response_text, 'Patient responded to check-in')
        WHERE id = v_alert_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'monitoring_id', v_monitoring_id,
        'alert_id', v_alert_id,
        'message', 'Patient response recorded, monitoring resolved'
    );
END;
$$;

-- =====================================================
-- PART 4: TRIGGERS AND AUTOMATION
-- =====================================================

-- Trigger: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_switchbot_devices_updated_at
    BEFORE UPDATE ON public.switchbot_devices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inactivity_monitoring_updated_at
    BEFORE UPDATE ON public.inactivity_monitoring
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- PART 5: COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.switchbot_devices IS 'Registered SwitchBot Motion Sensors mapped to patients';
COMMENT ON TABLE public.motion_sensor_events IS 'All motion detection events received from SwitchBot webhooks';
COMMENT ON TABLE public.inactivity_monitoring IS 'Active inactivity monitoring sessions with escalation tracking';

COMMENT ON FUNCTION public.process_motion_event IS 'Processes incoming motion events from SwitchBot webhook and manages inactivity monitoring';
COMMENT ON FUNCTION public.check_inactivity_thresholds IS 'Checks all active monitoring for threshold breaches and creates alerts';
COMMENT ON FUNCTION public.record_patient_response IS 'Records patient response to fall detection check-in';

-- =====================================================
-- PART 6: GRANTS
-- =====================================================

-- Grant necessary permissions for Edge Functions (service role)
GRANT ALL ON public.switchbot_devices TO service_role;
GRANT ALL ON public.motion_sensor_events TO service_role;
GRANT ALL ON public.inactivity_monitoring TO service_role;

-- Grant read access for authenticated users (controlled by RLS)
GRANT SELECT ON public.switchbot_devices TO authenticated;
GRANT SELECT ON public.motion_sensor_events TO authenticated;
GRANT SELECT ON public.inactivity_monitoring TO authenticated;

-- Migration complete
SELECT 'SwitchBot Fall Detection Migration Complete' as status;
