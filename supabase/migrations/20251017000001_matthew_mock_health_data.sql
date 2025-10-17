-- =====================================================
-- MOCK HEALTH DATA: MATTHEW SNOW
-- =====================================================
-- Mock health data from Galaxy Watch 7 & S23+
-- IDEMPOTENT: Can be run multiple times without errors
-- NOTE: Replace the patient_id with Matthew's actual UUID from profiles table

-- IMPORTANT: First, get Matthew's UUID
-- Run this query first to get the ID:
-- SELECT id FROM public.profiles WHERE email = 'matthew.snow2@gmail.com';
-- Then replace 'MATTHEWS_UUID_HERE' below with the actual UUID

DO $$
DECLARE
  v_patient_id UUID;
  v_device_galaxy_watch TEXT := 'SM-R930';  -- Galaxy Watch 7
  v_device_s23 TEXT := 'SM-S911U';          -- Samsung S23+
BEGIN
  -- Get Matthew's patient ID
  SELECT id INTO v_patient_id
  FROM public.profiles
  WHERE email = 'matthew.snow2@gmail.com';

  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Profile for matthew.snow2@gmail.com not found. Please create profile first.';
  END IF;

  -- Clear existing health data for Matthew
  DELETE FROM public.health_metrics WHERE patient_id = v_patient_id;
  DELETE FROM public.health_sync_status WHERE patient_id = v_patient_id;
  DELETE FROM public.health_metric_aggregates WHERE patient_id = v_patient_id;

  RAISE NOTICE 'Adding mock health data for Matthew Snow (ID: %)', v_patient_id;

  -- =====================================================
  -- HEART RATE DATA (Galaxy Watch 7 - continuous monitoring)
  -- =====================================================

  -- Day 0 (Today) - 15 readings throughout the day
  INSERT INTO public.health_metrics (patient_id, metric_type, recorded_at, value_numeric, unit, measurement_context, data_source, device_info, recording_method)
  VALUES
    -- Morning readings (resting)
    (v_patient_id, 'heart_rate', NOW() - INTERVAL '8 hours', 68, 'bpm', 'resting', 'Samsung Health', jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'PPG'), 'automatic'),
    (v_patient_id, 'heart_rate', NOW() - INTERVAL '7 hours', 72, 'bpm', 'resting', 'Samsung Health', jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'PPG'), 'automatic'),

    -- Mid-morning (light activity)
    (v_patient_id, 'heart_rate', NOW() - INTERVAL '6 hours', 85, 'bpm', 'active', 'Samsung Health', jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'PPG'), 'automatic'),
    (v_patient_id, 'heart_rate', NOW() - INTERVAL '5 hours', 78, 'bpm', 'resting', 'Samsung Health', jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'PPG'), 'automatic'),

    -- Afternoon (active)
    (v_patient_id, 'heart_rate', NOW() - INTERVAL '4 hours', 95, 'bpm', 'active', 'Samsung Health', jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'PPG'), 'automatic'),
    (v_patient_id, 'heart_rate', NOW() - INTERVAL '3 hours', 110, 'bpm', 'exercise', 'Samsung Health', jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'PPG'), 'automatic'),
    (v_patient_id, 'heart_rate', NOW() - INTERVAL '2 hours', 88, 'bpm', 'active', 'Samsung Health', jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'PPG'), 'automatic'),

    -- Evening (resting)
    (v_patient_id, 'heart_rate', NOW() - INTERVAL '1 hour', 74, 'bpm', 'resting', 'Samsung Health', jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'PPG'), 'automatic');

  -- Past 6 days - similar pattern (2-3 readings per day for brevity)
  INSERT INTO public.health_metrics (patient_id, metric_type, recorded_at, value_numeric, unit, measurement_context, data_source, device_info, recording_method)
  SELECT
    v_patient_id,
    'heart_rate',
    NOW() - (day_offset || ' days')::INTERVAL - (hour_offset || ' hours')::INTERVAL,
    65 + (RANDOM() * 20)::INTEGER,  -- Random between 65-85 bpm
    'bpm',
    'resting',
    'Samsung Health',
    jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'PPG'),
    'automatic'
  FROM generate_series(1, 6) AS day_offset,
       generate_series(8, 20, 6) AS hour_offset;

  -- =====================================================
  -- STEPS DATA (S23+ pedometer)
  -- =====================================================

  INSERT INTO public.health_metrics (patient_id, metric_type, recorded_at, value_numeric, unit, data_source, device_info, recording_method)
  VALUES
    -- Daily step counts
    (v_patient_id, 'steps', (NOW() - INTERVAL '0 days')::DATE::TIMESTAMPTZ, 8456, 'steps', 'Samsung Health', jsonb_build_object('device_model', v_device_s23, 'device_manufacturer', 'Samsung', 'sensor_type', 'Accelerometer'), 'automatic'),
    (v_patient_id, 'steps', (NOW() - INTERVAL '1 day')::DATE::TIMESTAMPTZ, 10234, 'steps', 'Samsung Health', jsonb_build_object('device_model', v_device_s23, 'device_manufacturer', 'Samsung', 'sensor_type', 'Accelerometer'), 'automatic'),
    (v_patient_id, 'steps', (NOW() - INTERVAL '2 days')::DATE::TIMESTAMPTZ, 9876, 'steps', 'Samsung Health', jsonb_build_object('device_model', v_device_s23, 'device_manufacturer', 'Samsung', 'sensor_type', 'Accelerometer'), 'automatic'),
    (v_patient_id, 'steps', (NOW() - INTERVAL '3 days')::DATE::TIMESTAMPTZ, 7234, 'steps', 'Samsung Health', jsonb_build_object('device_model', v_device_s23, 'device_manufacturer', 'Samsung', 'sensor_type', 'Accelerometer'), 'automatic'),
    (v_patient_id, 'steps', (NOW() - INTERVAL '4 days')::DATE::TIMESTAMPTZ, 11456, 'steps', 'Samsung Health', jsonb_build_object('device_model', v_device_s23, 'device_manufacturer', 'Samsung', 'sensor_type', 'Accelerometer'), 'automatic'),
    (v_patient_id, 'steps', (NOW() - INTERVAL '5 days')::DATE::TIMESTAMPTZ, 9123, 'steps', 'Samsung Health', jsonb_build_object('device_model', v_device_s23, 'device_manufacturer', 'Samsung', 'sensor_type', 'Accelerometer'), 'automatic'),
    (v_patient_id, 'steps', (NOW() - INTERVAL '6 days')::DATE::TIMESTAMPTZ, 8901, 'steps', 'Samsung Health', jsonb_build_object('device_model', v_device_s23, 'device_manufacturer', 'Samsung', 'sensor_type', 'Accelerometer'), 'automatic');

  -- =====================================================
  -- BLOOD PRESSURE DATA (Manual measurements)
  -- =====================================================

  INSERT INTO public.health_metrics (patient_id, metric_type, recorded_at, value_json, unit, measurement_context, body_position, measurement_location, data_source, device_info, recording_method)
  VALUES
    (v_patient_id, 'blood_pressure', NOW() - INTERVAL '2 days' - INTERVAL '9 hours', '{"systolic": 122, "diastolic": 78}'::jsonb, 'mmHg', 'resting', 'sitting', 'left_wrist', 'Samsung Health', jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'Oscillometric'), 'manual'),
    (v_patient_id, 'blood_pressure', NOW() - INTERVAL '5 days' - INTERVAL '10 hours', '{"systolic": 118, "diastolic": 76}'::jsonb, 'mmHg', 'resting', 'sitting', 'left_wrist', 'Samsung Health', jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'Oscillometric'), 'manual');

  -- =====================================================
  -- OXYGEN SATURATION (SpO2) - Galaxy Watch 7
  -- =====================================================

  INSERT INTO public.health_metrics (patient_id, metric_type, recorded_at, value_numeric, unit, measurement_context, data_source, device_info, recording_method)
  VALUES
    (v_patient_id, 'oxygen_saturation', NOW() - INTERVAL '1 day' - INTERVAL '8 hours', 98, '%', 'resting', 'Samsung Health', jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'Red LED/Infrared'), 'automatic'),
    (v_patient_id, 'oxygen_saturation', NOW() - INTERVAL '3 days' - INTERVAL '9 hours', 97, '%', 'resting', 'Samsung Health', jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'Red LED/Infrared'), 'automatic'),
    (v_patient_id, 'oxygen_saturation', NOW() - INTERVAL '6 days' - INTERVAL '10 hours', 98, '%', 'resting', 'Samsung Health', jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'Red LED/Infrared'), 'automatic');

  -- =====================================================
  -- SLEEP DATA (Galaxy Watch 7 sleep tracking)
  -- =====================================================

  INSERT INTO public.health_metrics (patient_id, metric_type, recorded_at, value_json, unit, data_source, device_info, recording_method)
  VALUES
    -- Last night's sleep
    (v_patient_id, 'sleep_session', (NOW() - INTERVAL '1 day')::DATE::TIMESTAMPTZ + INTERVAL '23 hours',
     jsonb_build_object(
       'duration_minutes', 426,
       'sleep_stages', jsonb_build_object(
         'awake_minutes', 24,
         'light_sleep_minutes', 198,
         'deep_sleep_minutes', 132,
         'rem_sleep_minutes', 72
       ),
       'sleep_score', 82,
       'start_time', ((NOW() - INTERVAL '1 day')::DATE::TIMESTAMPTZ + INTERVAL '23 hours')::TEXT,
       'end_time', (NOW()::DATE::TIMESTAMPTZ + INTERVAL '6 hours' + INTERVAL '6 minutes')::TEXT
     ),
     'minutes',
     'Samsung Health',
     jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'Accelerometer + PPG'),
     'automatic'),

    -- Previous nights
    (v_patient_id, 'sleep_session', (NOW() - INTERVAL '2 days')::DATE::TIMESTAMPTZ + INTERVAL '23 hours',
     jsonb_build_object(
       'duration_minutes', 402,
       'sleep_stages', jsonb_build_object(
         'awake_minutes', 30,
         'light_sleep_minutes', 186,
         'deep_sleep_minutes', 120,
         'rem_sleep_minutes', 66
       ),
       'sleep_score', 78,
       'start_time', ((NOW() - INTERVAL '2 days')::DATE::TIMESTAMPTZ + INTERVAL '23 hours')::TEXT,
       'end_time', ((NOW() - INTERVAL '1 day')::DATE::TIMESTAMPTZ + INTERVAL '5 hours' + INTERVAL '42 minutes')::TEXT
     ),
     'minutes',
     'Samsung Health',
     jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'Accelerometer + PPG'),
     'automatic');

  -- =====================================================
  -- DISTANCE & CALORIES (Derived from steps/activity)
  -- =====================================================

  INSERT INTO public.health_metrics (patient_id, metric_type, recorded_at, value_numeric, unit, data_source, device_info, recording_method)
  VALUES
    -- Today's distance
    (v_patient_id, 'distance', (NOW() - INTERVAL '0 days')::DATE::TIMESTAMPTZ, 6.8, 'km', 'Samsung Health', jsonb_build_object('device_model', v_device_s23, 'device_manufacturer', 'Samsung'), 'automatic'),

    -- Today's calories
    (v_patient_id, 'active_calories', (NOW() - INTERVAL '0 days')::DATE::TIMESTAMPTZ, 487, 'kcal', 'Samsung Health', jsonb_build_object('device_model', v_device_s23, 'device_manufacturer', 'Samsung'), 'automatic'),
    (v_patient_id, 'total_calories', (NOW() - INTERVAL '0 days')::DATE::TIMESTAMPTZ, 2234, 'kcal', 'Samsung Health', jsonb_build_object('device_model', v_device_s23, 'device_manufacturer', 'Samsung'), 'automatic');

  -- =====================================================
  -- RESTING HEART RATE (Daily calculation from Galaxy Watch 7)
  -- =====================================================

  INSERT INTO public.health_metrics (patient_id, metric_type, recorded_at, value_numeric, unit, measurement_context, data_source, device_info, recording_method)
  SELECT
    v_patient_id,
    'resting_heart_rate',
    (NOW() - (day_offset || ' days')::INTERVAL)::DATE::TIMESTAMPTZ + INTERVAL '7 hours',
    68 + (RANDOM() * 8)::INTEGER,  -- Random between 68-76 bpm
    'bpm',
    'resting',
    'Samsung Health',
    jsonb_build_object('device_model', v_device_galaxy_watch, 'device_manufacturer', 'Samsung', 'sensor_type', 'PPG'),
    'automatic'
  FROM generate_series(0, 6) AS day_offset;

  -- =====================================================
  -- SYNC STATUS (Simulating successful device sync)
  -- =====================================================

  INSERT INTO public.health_sync_status (
    patient_id,
    device_id,
    device_name,
    health_connect_available,
    health_connect_version,
    sync_enabled,
    sync_frequency_minutes,
    background_sync_enabled,
    enabled_metrics,
    last_successful_sync_at,
    last_sync_attempt_at,
    last_sync_status,
    total_syncs,
    total_records_synced,
    last_records_count,
    permissions_granted,
    battery_optimization_disabled
  ) VALUES
    -- Galaxy Watch 7
    (
      v_patient_id,
      v_device_galaxy_watch || '_' || SUBSTRING(v_patient_id::TEXT FROM 1 FOR 8),
      'Galaxy Watch 7',
      true,
      '1.1.0.1039',
      true,
      60,
      true,
      ARRAY['heart_rate', 'blood_pressure', 'oxygen_saturation', 'sleep_session', 'resting_heart_rate'],
      NOW() - INTERVAL '15 minutes',
      NOW() - INTERVAL '15 minutes',
      'success',
      247,
      3891,
      42,
      ARRAY['HEART_RATE', 'BLOOD_PRESSURE', 'OXYGEN_SATURATION', 'SLEEP'],
      true
    ),
    -- Samsung S23+
    (
      v_patient_id,
      v_device_s23 || '_' || SUBSTRING(v_patient_id::TEXT FROM 1 FOR 8),
      'Samsung Galaxy S23+',
      true,
      '1.1.0.1039',
      true,
      120,
      true,
      ARRAY['steps', 'distance', 'active_calories', 'total_calories'],
      NOW() - INTERVAL '30 minutes',
      NOW() - INTERVAL '30 minutes',
      'success',
      186,
      2145,
      15,
      ARRAY['STEPS', 'DISTANCE', 'ACTIVE_ENERGY_BURNED', 'TOTAL_CALORIES_BURNED'],
      true
    );

  RAISE NOTICE 'Mock health data added successfully!';
  RAISE NOTICE 'Total heart rate readings: %', (SELECT COUNT(*) FROM public.health_metrics WHERE patient_id = v_patient_id AND metric_type = 'heart_rate');
  RAISE NOTICE 'Total step counts: %', (SELECT COUNT(*) FROM public.health_metrics WHERE patient_id = v_patient_id AND metric_type = 'steps');
  RAISE NOTICE 'Total sleep sessions: %', (SELECT COUNT(*) FROM public.health_metrics WHERE patient_id = v_patient_id AND metric_type = 'sleep_session');

END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all health metrics for Matthew
SELECT
  metric_type,
  COUNT(*) as reading_count,
  MIN(recorded_at) as earliest,
  MAX(recorded_at) as latest
FROM public.health_metrics
WHERE patient_id = (SELECT id FROM public.profiles WHERE email = 'matthew.snow2@gmail.com')
GROUP BY metric_type
ORDER BY metric_type;

-- Check sync status
SELECT
  device_name,
  last_successful_sync_at,
  last_sync_status,
  total_syncs,
  total_records_synced
FROM public.health_sync_status
WHERE patient_id = (SELECT id FROM public.profiles WHERE email = 'matthew.snow2@gmail.com');
