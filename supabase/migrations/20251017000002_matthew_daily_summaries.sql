-- =====================================================
-- CREATE DAILY SUMMARIES FOR MATTHEW SNOW
-- =====================================================
-- Generates daily_summaries based on Matthew's health_metrics data
-- RUN AFTER: 20251017000001_matthew_mock_health_data.sql

DO $$
DECLARE
  v_patient_id UUID;
BEGIN
  -- Get Matthew's patient ID
  SELECT id INTO v_patient_id
  FROM public.profiles
  WHERE email = 'matthew.snow2@gmail.com';

  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Profile for matthew.snow2@gmail.com not found. Please create profile first.';
  END IF;

  RAISE NOTICE 'Creating daily summaries for Matthew Snow (ID: %)', v_patient_id;

  -- Clear existing daily summaries for Matthew
  DELETE FROM public.daily_summaries WHERE patient_id = v_patient_id;

  -- Create daily summaries for the past 7 days based on health data
  -- Day 0 (Today) - Active day with exercise
  INSERT INTO public.daily_summaries (
    patient_id,
    summary_date,
    check_in_count,
    total_conversation_minutes,
    overall_mood,
    average_sentiment_score,
    medication_taken,
    meals_reported,
    activity_reported,
    sleep_quality,
    overall_status,
    status_reason,
    summary_text,
    highlights,
    concerns,
    alerts_triggered,
    alert_types
  ) VALUES (
    v_patient_id,
    CURRENT_DATE,
    0,  -- No check-ins, only health data
    0,
    'neutral',
    0.50,
    NULL,  -- Not tracked via check-ins
    0,
    true,  -- Activity detected from steps/heart rate
    'not_reported',
    'ok',
    NULL,
    'Matthew had an active day with 8,456 steps (6.8 km) and burned 487 active calories. Heart rate ranged from 68-110 bpm with peak during afternoon exercise. All vitals within normal ranges.',
    ARRAY['Good activity level', 'Regular step count', 'Heart rate patterns normal'],
    NULL,
    0,
    NULL
  );

  -- Day 1 (Yesterday) - High activity day
  INSERT INTO public.daily_summaries (
    patient_id,
    summary_date,
    check_in_count,
    total_conversation_minutes,
    overall_mood,
    average_sentiment_score,
    medication_taken,
    meals_reported,
    activity_reported,
    sleep_quality,
    overall_status,
    status_reason,
    summary_text,
    highlights,
    concerns,
    alerts_triggered,
    alert_types
  ) VALUES (
    v_patient_id,
    CURRENT_DATE - 1,
    0,
    0,
    'happy',
    0.60,
    NULL,
    0,
    true,
    'good',  -- Sleep data available
    'ok',
    NULL,
    'Matthew had a very active day with 10,234 steps. Sleep quality was good with 7.1 hours total (82 sleep score), including 2.2 hours deep sleep and 1.2 hours REM. Resting heart rate: 70 bpm.',
    ARRAY['Excellent step count', 'Good sleep quality', 'Strong deep sleep duration'],
    NULL,
    0,
    NULL
  );

  -- Day 2 - Good activity and sleep
  INSERT INTO public.daily_summaries (
    patient_id,
    summary_date,
    check_in_count,
    total_conversation_minutes,
    overall_mood,
    average_sentiment_score,
    medication_taken,
    meals_reported,
    activity_reported,
    sleep_quality,
    overall_status,
    status_reason,
    summary_text,
    highlights,
    concerns,
    alerts_triggered,
    alert_types
  ) VALUES (
    v_patient_id,
    CURRENT_DATE - 2,
    0,
    0,
    'neutral',
    0.55,
    NULL,
    0,
    true,
    'good',  -- Sleep data available
    'ok',
    NULL,
    'Matthew recorded 9,876 steps with good movement throughout the day. Blood pressure measured at 122/78 mmHg (excellent). Sleep: 6.7 hours total (78 sleep score). Resting heart rate: 72 bpm.',
    ARRAY['Healthy blood pressure', 'Consistent activity', 'Adequate sleep'],
    NULL,
    0,
    NULL
  );

  -- Day 3 - Lower activity
  INSERT INTO public.daily_summaries (
    patient_id,
    summary_date,
    check_in_count,
    total_conversation_minutes,
    overall_mood,
    average_sentiment_score,
    medication_taken,
    meals_reported,
    activity_reported,
    sleep_quality,
    overall_status,
    status_reason,
    summary_text,
    highlights,
    concerns,
    alerts_triggered,
    alert_types
  ) VALUES (
    v_patient_id,
    CURRENT_DATE - 3,
    0,
    0,
    'neutral',
    0.45,
    NULL,
    0,
    true,
    'not_reported',
    'ok',
    NULL,
    'Matthew had a lighter activity day with 7,234 steps. Oxygen saturation measured at 97% (normal). All vital signs remain within healthy ranges. Resting heart rate: 69 bpm.',
    ARRAY['Normal oxygen levels', 'Consistent heart rate'],
    ARRAY['Lower step count than usual'],
    0,
    NULL
  );

  -- Day 4 - Very active day
  INSERT INTO public.daily_summaries (
    patient_id,
    summary_date,
    check_in_count,
    total_conversation_minutes,
    overall_mood,
    average_sentiment_score,
    medication_taken,
    meals_reported,
    activity_reported,
    sleep_quality,
    overall_status,
    status_reason,
    summary_text,
    highlights,
    concerns,
    alerts_triggered,
    alert_types
  ) VALUES (
    v_patient_id,
    CURRENT_DATE - 4,
    0,
    0,
    'happy',
    0.65,
    NULL,
    0,
    true,
    'not_reported',
    'ok',
    NULL,
    'Matthew had an excellent activity day with 11,456 steps - the highest count this week. Heart rate patterns indicate sustained moderate activity. Resting heart rate: 68 bpm.',
    ARRAY['Peak weekly step count', 'Excellent cardiovascular activity'],
    NULL,
    0,
    NULL
  );

  -- Day 5 - Good activity
  INSERT INTO public.daily_summaries (
    patient_id,
    summary_date,
    check_in_count,
    total_conversation_minutes,
    overall_mood,
    average_sentiment_score,
    medication_taken,
    meals_reported,
    activity_reported,
    sleep_quality,
    overall_status,
    status_reason,
    summary_text,
    highlights,
    concerns,
    alerts_triggered,
    alert_types
  ) VALUES (
    v_patient_id,
    CURRENT_DATE - 5,
    0,
    0,
    'neutral',
    0.55,
    NULL,
    0,
    true,
    'not_reported',
    'ok',
    NULL,
    'Matthew recorded 9,123 steps. Blood pressure: 118/76 mmHg (optimal). Heart rate variability indicates good recovery. Resting heart rate: 73 bpm.',
    ARRAY['Optimal blood pressure', 'Good step consistency'],
    NULL,
    0,
    NULL
  );

  -- Day 6 - Moderate activity
  INSERT INTO public.daily_summaries (
    patient_id,
    summary_date,
    check_in_count,
    total_conversation_minutes,
    overall_mood,
    average_sentiment_score,
    medication_taken,
    meals_reported,
    activity_reported,
    sleep_quality,
    overall_status,
    status_reason,
    summary_text,
    highlights,
    concerns,
    alerts_triggered,
    alert_types
  ) VALUES (
    v_patient_id,
    CURRENT_DATE - 6,
    0,
    0,
    'neutral',
    0.50,
    NULL,
    0,
    true,
    'not_reported',
    'ok',
    NULL,
    'Matthew walked 8,901 steps. Oxygen saturation: 98% (excellent). All health metrics trending positively. Resting heart rate: 71 bpm.',
    ARRAY['Excellent oxygen levels', 'Stable activity patterns'],
    NULL,
    0,
    NULL
  );

  RAISE NOTICE 'Daily summaries created successfully!';
  RAISE NOTICE 'Total summaries: %', (SELECT COUNT(*) FROM public.daily_summaries WHERE patient_id = v_patient_id);

END $$;

-- Verification query
SELECT
  summary_date,
  check_in_count,
  activity_reported,
  sleep_quality,
  overall_status,
  overall_mood,
  LEFT(summary_text, 80) || '...' as summary_preview
FROM public.daily_summaries
WHERE patient_id = (SELECT id FROM public.profiles WHERE email = 'matthew.snow2@gmail.com')
ORDER BY summary_date DESC;
