-- =====================================================
-- HEALTH CONNECT INTEGRATION MIGRATION
-- =====================================================
-- This migration adds all tables and functions needed for
-- Android Health Connect integration
--
-- Author: Para Kind Connect Team
-- Date: 2025-10-16
-- Version: 1.0
-- =====================================================

-- =====================================================
-- 1. CREATE HEALTH_METRICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User reference
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,

  -- Metric identification
  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'heart_rate', 'blood_pressure', 'blood_glucose', 'oxygen_saturation',
    'steps', 'distance', 'floors_climbed', 'active_calories', 'total_calories',
    'weight', 'height', 'body_temperature', 'respiratory_rate',
    'sleep_session', 'sleep_stage', 'heart_rate_variability',
    'hydration', 'nutrition', 'exercise_session',
    'resting_heart_rate', 'vo2_max'
  )),

  -- Time information
  recorded_at TIMESTAMPTZ NOT NULL,
  recorded_date DATE NOT NULL GENERATED ALWAYS AS ((recorded_at AT TIME ZONE 'UTC')::DATE) STORED,

  -- Value storage (flexible JSON for different metric types)
  value_numeric DECIMAL(10,2),           -- For single numeric values (heart rate, weight, etc.)
  value_json JSONB,                       -- For complex values (blood pressure, sleep stages)

  -- Units and context
  unit TEXT,                              -- 'bpm', 'mmHg', 'mg/dL', '%', 'steps', 'kg', etc.
  measurement_context TEXT,               -- 'resting', 'active', 'post_exercise', 'fasting'
  body_position TEXT,                     -- For blood pressure: 'sitting', 'standing', 'lying_down'
  measurement_location TEXT,              -- For blood pressure: 'left_wrist', 'right_upper_arm'

  -- Data quality and metadata
  data_source TEXT,                       -- Source app name (e.g., 'Samsung Health', 'Google Fit')
  health_connect_id TEXT,                 -- Original Health Connect record ID
  recording_method TEXT CHECK (recording_method IN ('automatic', 'manual')),
  device_info JSONB,                      -- Device details from Health Connect

  -- Sync tracking
  synced_from_device_at TIMESTAMPTZ,     -- When data was on device
  synced_to_server_at TIMESTAMPTZ DEFAULT NOW(),

  -- Alert flagging
  is_anomaly BOOLEAN DEFAULT false,
  anomaly_reason TEXT,
  alert_generated BOOLEAN DEFAULT false,

  -- Indexing and tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate records
  UNIQUE(patient_id, metric_type, recorded_at, health_connect_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_metrics_patient ON public.health_metrics(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_type ON public.health_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_health_metrics_recorded_at ON public.health_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_recorded_date ON public.health_metrics(recorded_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_metrics_patient_type_date ON public.health_metrics(patient_id, metric_type, recorded_date);
CREATE INDEX IF NOT EXISTS idx_health_metrics_anomaly ON public.health_metrics(is_anomaly) WHERE is_anomaly = true;
CREATE INDEX IF NOT EXISTS idx_health_metrics_patient_recent ON public.health_metrics(patient_id, metric_type, recorded_at DESC);

-- Enable Row Level Security
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Patients can view their own health metrics"
  ON public.health_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert their own health metrics"
  ON public.health_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Caregivers can view their patients' health metrics"
  ON public.health_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_relationships
      WHERE patient_id = health_metrics.patient_id
      AND caregiver_id = auth.uid()
      AND status = 'active'
      AND can_view_health_data = true
    )
  );

-- Comments
COMMENT ON TABLE public.health_metrics IS 'Stores health data synced from Android Health Connect';
COMMENT ON COLUMN public.health_metrics.value_numeric IS 'Single numeric value (heart rate: 72, weight: 75.5)';
COMMENT ON COLUMN public.health_metrics.value_json IS 'Complex values like blood_pressure: {"systolic": 120, "diastolic": 80}';

-- =====================================================
-- 2. CREATE HEALTH_SYNC_STATUS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.health_sync_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User and device identification
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,

  -- Health Connect status
  health_connect_available BOOLEAN DEFAULT true,
  health_connect_version TEXT,

  -- Sync configuration
  sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 60,
  background_sync_enabled BOOLEAN DEFAULT true,

  -- Enabled metric types
  enabled_metrics TEXT[] DEFAULT ARRAY[
    'heart_rate', 'blood_pressure', 'blood_glucose', 'oxygen_saturation',
    'steps', 'weight', 'sleep_session'
  ],

  -- Sync status
  last_successful_sync_at TIMESTAMPTZ,
  last_sync_attempt_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'partial', 'failed', 'never')),
  last_sync_error TEXT,
  consecutive_failures INTEGER DEFAULT 0,

  -- Statistics
  total_syncs INTEGER DEFAULT 0,
  total_records_synced INTEGER DEFAULT 0,
  last_records_count INTEGER DEFAULT 0,

  -- Permissions
  permissions_granted TEXT[],
  permissions_denied TEXT[],
  last_permission_request_at TIMESTAMPTZ,

  -- Battery optimization
  battery_optimization_disabled BOOLEAN,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One sync status per patient-device combination
  UNIQUE(patient_id, device_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_health_sync_patient ON public.health_sync_status(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_sync_enabled ON public.health_sync_status(sync_enabled) WHERE sync_enabled = true;
CREATE INDEX IF NOT EXISTS idx_health_sync_last_sync ON public.health_sync_status(last_successful_sync_at DESC);

-- Enable RLS
ALTER TABLE public.health_sync_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Patients can view their own sync status"
  ON public.health_sync_status FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can manage their own sync status"
  ON public.health_sync_status FOR ALL
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Caregivers can view their patients' sync status"
  ON public.health_sync_status FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_relationships
      WHERE patient_id = health_sync_status.patient_id
      AND caregiver_id = auth.uid()
      AND status = 'active'
    )
  );

-- Comments
COMMENT ON TABLE public.health_sync_status IS 'Tracks Health Connect sync status for each patient device';

-- =====================================================
-- 3. CREATE HEALTH_METRIC_AGGREGATES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.health_metric_aggregates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- User and time
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  metric_type TEXT NOT NULL,
  aggregation_period TEXT NOT NULL CHECK (aggregation_period IN ('hourly', 'daily', 'weekly', 'monthly')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Aggregate statistics
  count INTEGER DEFAULT 0,
  min_value DECIMAL(10,2),
  max_value DECIMAL(10,2),
  avg_value DECIMAL(10,2),
  sum_value DECIMAL(10,2),
  median_value DECIMAL(10,2),
  std_dev DECIMAL(10,2),

  -- Complex aggregates (stored as JSON)
  percentiles JSONB,
  time_in_range JSONB,
  distribution JSONB,

  -- Trend indicators
  trend_direction TEXT CHECK (trend_direction IN ('up', 'down', 'stable', 'volatile')),
  trend_percentage DECIMAL(5,2),

  -- Alert indicators
  anomaly_count INTEGER DEFAULT 0,
  alert_count INTEGER DEFAULT 0,

  -- Metadata
  data_quality_score DECIMAL(3,2),
  missing_data_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(patient_id, metric_type, aggregation_period, period_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_health_aggregates_patient ON public.health_metric_aggregates(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_aggregates_type ON public.health_metric_aggregates(metric_type);
CREATE INDEX IF NOT EXISTS idx_health_aggregates_period ON public.health_metric_aggregates(aggregation_period, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_health_aggregates_composite ON public.health_metric_aggregates(
  patient_id, metric_type, aggregation_period, period_start DESC
);

-- Enable RLS
ALTER TABLE public.health_metric_aggregates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Patients can view their own aggregates"
  ON public.health_metric_aggregates FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

CREATE POLICY "Caregivers can view their patients' aggregates"
  ON public.health_metric_aggregates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.care_relationships
      WHERE patient_id = health_metric_aggregates.patient_id
      AND caregiver_id = auth.uid()
      AND status = 'active'
      AND can_view_health_data = true
    )
  );

-- Comments
COMMENT ON TABLE public.health_metric_aggregates IS 'Pre-computed health metric aggregates for dashboard performance';

-- =====================================================
-- 4. UPDATE EXISTING TABLES
-- =====================================================

-- Add health metric columns to daily_summaries
ALTER TABLE public.daily_summaries
ADD COLUMN IF NOT EXISTS health_metrics_synced BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS health_metrics_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_heart_rate INTEGER,
ADD COLUMN IF NOT EXISTS avg_systolic_bp INTEGER,
ADD COLUMN IF NOT EXISTS avg_diastolic_bp INTEGER,
ADD COLUMN IF NOT EXISTS total_steps INTEGER,
ADD COLUMN IF NOT EXISTS sleep_hours DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS health_data_completeness DECIMAL(3,2);

COMMENT ON COLUMN public.daily_summaries.health_data_completeness IS 'Percentage of expected health metrics received for the day (0.0-1.0)';

-- Update alerts table with health metric alert types
ALTER TABLE public.alerts
DROP CONSTRAINT IF EXISTS alerts_alert_type_check;

ALTER TABLE public.alerts
ADD CONSTRAINT alerts_alert_type_check
CHECK (alert_type IN (
  'fall_detected', 'distress_signal', 'missed_checkin', 'medication_missed',
  'prolonged_inactivity', 'health_concern', 'manual',
  -- New health metric alerts
  'high_blood_pressure', 'low_blood_pressure', 'high_heart_rate', 'low_heart_rate',
  'low_oxygen_saturation', 'high_blood_glucose', 'low_blood_glucose',
  'insufficient_steps', 'insufficient_sleep', 'rapid_weight_change',
  'health_sync_failure', 'missing_health_data'
));

-- Add reference to health metric
ALTER TABLE public.alerts
ADD COLUMN IF NOT EXISTS health_metric_id UUID REFERENCES public.health_metrics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_alerts_health_metric ON public.alerts(health_metric_id);

-- Add Health Connect settings to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS health_connect_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS health_connect_device_id TEXT,
ADD COLUMN IF NOT EXISTS health_alert_preferences JSONB DEFAULT '{
  "enabled": true,
  "email_alerts": true,
  "push_alerts": true,
  "quiet_hours": {"start": "22:00", "end": "07:00"},
  "thresholds": {
    "blood_pressure_systolic_high": 140,
    "blood_pressure_systolic_critical": 180,
    "blood_pressure_diastolic_high": 90,
    "heart_rate_high": 100,
    "heart_rate_low": 50,
    "steps_low": 2000,
    "sleep_hours_low": 6
  }
}'::jsonb;

COMMENT ON COLUMN public.profiles.health_alert_preferences IS 'User-specific alert thresholds and notification preferences';

-- =====================================================
-- 5. CREATE FUNCTIONS
-- =====================================================

-- Function: Detect health metric anomalies
CREATE OR REPLACE FUNCTION detect_health_anomaly(
  p_patient_id UUID,
  p_metric_type TEXT,
  p_value_numeric DECIMAL,
  p_value_json JSONB
)
RETURNS TABLE (
  is_anomaly BOOLEAN,
  severity TEXT,
  reason TEXT
) AS $$
DECLARE
  v_thresholds JSONB;
  v_systolic INTEGER;
  v_diastolic INTEGER;
BEGIN
  -- Get user's alert preferences
  SELECT health_alert_preferences
  INTO v_thresholds
  FROM public.profiles
  WHERE id = p_patient_id;

  -- Default to standard thresholds if not set
  IF v_thresholds IS NULL THEN
    v_thresholds := '{
      "thresholds": {
        "blood_pressure_systolic_high": 140,
        "blood_pressure_systolic_critical": 180,
        "blood_pressure_diastolic_high": 90,
        "heart_rate_high": 100,
        "heart_rate_low": 50
      }
    }'::jsonb;
  END IF;

  -- Check thresholds based on metric type
  CASE p_metric_type
    WHEN 'blood_pressure' THEN
      v_systolic := (p_value_json->>'systolic')::INTEGER;
      v_diastolic := (p_value_json->>'diastolic')::INTEGER;

      IF v_systolic >= (v_thresholds->'thresholds'->>'blood_pressure_systolic_critical')::INTEGER THEN
        RETURN QUERY SELECT true, 'critical'::TEXT, 'Systolic BP critically high'::TEXT;
      ELSIF v_systolic >= (v_thresholds->'thresholds'->>'blood_pressure_systolic_high')::INTEGER THEN
        RETURN QUERY SELECT true, 'high'::TEXT, 'Systolic BP elevated'::TEXT;
      ELSIF v_diastolic >= (v_thresholds->'thresholds'->>'blood_pressure_diastolic_high')::INTEGER THEN
        RETURN QUERY SELECT true, 'high'::TEXT, 'Diastolic BP elevated'::TEXT;
      END IF;

    WHEN 'heart_rate' THEN
      IF p_value_numeric >= (v_thresholds->'thresholds'->>'heart_rate_high')::INTEGER THEN
        RETURN QUERY SELECT true, 'medium'::TEXT, 'Heart rate elevated'::TEXT;
      ELSIF p_value_numeric <= (v_thresholds->'thresholds'->>'heart_rate_low')::INTEGER THEN
        RETURN QUERY SELECT true, 'medium'::TEXT, 'Heart rate low'::TEXT;
      END IF;

    WHEN 'oxygen_saturation' THEN
      IF p_value_numeric < 90 THEN
        RETURN QUERY SELECT true, 'critical'::TEXT, 'Oxygen saturation critically low'::TEXT;
      ELSIF p_value_numeric < 95 THEN
        RETURN QUERY SELECT true, 'medium'::TEXT, 'Oxygen saturation low'::TEXT;
      END IF;

    WHEN 'blood_glucose' THEN
      IF p_value_numeric > 180 THEN
        RETURN QUERY SELECT true, 'high'::TEXT, 'Blood glucose very high'::TEXT;
      ELSIF p_value_numeric < 70 THEN
        RETURN QUERY SELECT true, 'high'::TEXT, 'Blood glucose low'::TEXT;
      END IF;

    ELSE
      -- No anomaly detected
      RETURN QUERY SELECT false, 'normal'::TEXT, NULL::TEXT;
  END CASE;

  -- If we reach here, no anomaly detected
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'normal'::TEXT, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Create alert from health anomaly
CREATE OR REPLACE FUNCTION create_health_alert()
RETURNS TRIGGER AS $$
DECLARE
  v_alert_type TEXT;
  v_alert_message TEXT;
  v_caregivers UUID[];
BEGIN
  -- Only proceed if anomaly detected
  IF NOT NEW.is_anomaly THEN
    RETURN NEW;
  END IF;

  -- Map metric type to alert type
  CASE NEW.metric_type
    WHEN 'blood_pressure' THEN
      v_alert_type := 'high_blood_pressure';
      v_alert_message := format('Blood pressure reading: %s/%s mmHg',
        NEW.value_json->>'systolic', NEW.value_json->>'diastolic');
    WHEN 'heart_rate' THEN
      v_alert_type := CASE
        WHEN NEW.value_numeric > 100 THEN 'high_heart_rate'
        ELSE 'low_heart_rate'
      END;
      v_alert_message := format('Heart rate: %s bpm', NEW.value_numeric);
    WHEN 'oxygen_saturation' THEN
      v_alert_type := 'low_oxygen_saturation';
      v_alert_message := format('Oxygen saturation: %s%%', NEW.value_numeric);
    WHEN 'blood_glucose' THEN
      v_alert_type := CASE
        WHEN NEW.value_numeric > 180 THEN 'high_blood_glucose'
        ELSE 'low_blood_glucose'
      END;
      v_alert_message := format('Blood glucose: %s mg/dL', NEW.value_numeric);
    ELSE
      v_alert_type := 'health_concern';
      v_alert_message := format('%s anomaly detected', NEW.metric_type);
  END CASE;

  -- Get list of caregivers to notify
  SELECT ARRAY_AGG(caregiver_id)
  INTO v_caregivers
  FROM public.care_relationships
  WHERE patient_id = NEW.patient_id
  AND status = 'active'
  AND can_receive_alerts = true;

  -- Insert alert
  INSERT INTO public.alerts (
    patient_id,
    alert_type,
    severity,
    alert_message,
    alert_details,
    health_metric_id,
    notified_caregivers
  ) VALUES (
    NEW.patient_id,
    v_alert_type,
    CASE NEW.anomaly_reason
      WHEN 'critically high' THEN 'critical'
      WHEN 'critically low' THEN 'critical'
      ELSE 'high'
    END,
    v_alert_message,
    jsonb_build_object(
      'metric_type', NEW.metric_type,
      'recorded_at', NEW.recorded_at,
      'anomaly_reason', NEW.anomaly_reason,
      'value', COALESCE(NEW.value_json, to_jsonb(NEW.value_numeric))
    ),
    NEW.id,
    v_caregivers
  );

  -- Mark alert as generated
  NEW.alert_generated := true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update daily aggregates
CREATE OR REPLACE FUNCTION update_health_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  -- Update daily aggregate
  INSERT INTO public.health_metric_aggregates (
    patient_id,
    metric_type,
    aggregation_period,
    period_start,
    period_end,
    count,
    min_value,
    max_value,
    avg_value,
    sum_value
  )
  SELECT
    NEW.patient_id,
    NEW.metric_type,
    'daily',
    DATE_TRUNC('day', NEW.recorded_at),
    DATE_TRUNC('day', NEW.recorded_at) + INTERVAL '1 day',
    COUNT(*),
    MIN(value_numeric),
    MAX(value_numeric),
    AVG(value_numeric),
    SUM(value_numeric)
  FROM public.health_metrics
  WHERE patient_id = NEW.patient_id
  AND metric_type = NEW.metric_type
  AND recorded_date = NEW.recorded_date
  GROUP BY patient_id, metric_type
  ON CONFLICT (patient_id, metric_type, aggregation_period, period_start)
  DO UPDATE SET
    count = EXCLUDED.count,
    min_value = EXCLUDED.min_value,
    max_value = EXCLUDED.max_value,
    avg_value = EXCLUDED.avg_value,
    sum_value = EXCLUDED.sum_value,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. CREATE TRIGGERS
-- =====================================================

-- Trigger: Update updated_at timestamp
CREATE TRIGGER set_health_metrics_updated_at
  BEFORE UPDATE ON public.health_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_health_sync_status_updated_at
  BEFORE UPDATE ON public.health_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_health_aggregates_updated_at
  BEFORE UPDATE ON public.health_metric_aggregates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: Create alert on health anomaly
CREATE TRIGGER create_alert_on_health_anomaly
  BEFORE INSERT OR UPDATE ON public.health_metrics
  FOR EACH ROW
  WHEN (NEW.is_anomaly = true AND NEW.alert_generated = false)
  EXECUTE FUNCTION create_health_alert();

-- Trigger: Update aggregates on metric insert
CREATE TRIGGER update_aggregates_on_metric_insert
  AFTER INSERT ON public.health_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_health_aggregates();

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.health_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_sync_status TO authenticated;
GRANT SELECT ON public.health_metric_aggregates TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'health_metrics') THEN
    RAISE EXCEPTION 'health_metrics table was not created';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'health_sync_status') THEN
    RAISE EXCEPTION 'health_sync_status table was not created';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'health_metric_aggregates') THEN
    RAISE EXCEPTION 'health_metric_aggregates table was not created';
  END IF;

  RAISE NOTICE 'Health Connect integration migration completed successfully!';
END $$;
