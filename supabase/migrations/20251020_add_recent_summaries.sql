-- =====================================================
-- ADD RECENT DAILY SUMMARIES FOR MATTHEW SNOW (Oct 18-20)
-- =====================================================
-- Adds missing daily summaries for recent dates

DO $$
DECLARE
  v_patient_id UUID;
BEGIN
  -- Get Matthew's patient ID
  SELECT id INTO v_patient_id
  FROM public.profiles
  WHERE email = 'matthew.snow2@gmail.com';

  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Profile for matthew.snow2@gmail.com not found';
  END IF;

  RAISE NOTICE 'Adding recent daily summaries for Matthew Snow (ID: %)', v_patient_id;

  -- Oct 18 - Good activity day
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
    '2025-10-18',
    0,
    0,
    'happy',
    0.62,
    NULL,
    0,
    true,
    'good',
    'ok',
    NULL,
    'Matthew had a productive day with 9,567 steps and burned 423 active calories. Sleep quality was good with 7.3 hours total (80 sleep score). Blood pressure: 120/77 mmHg. Resting heart rate: 71 bpm.',
    ARRAY['Good step count', 'Quality sleep', 'Healthy blood pressure'],
    NULL,
    0,
    NULL
  ) ON CONFLICT (patient_id, summary_date) DO NOTHING;

  -- Oct 19 - Active day
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
    '2025-10-19',
    0,
    0,
    'neutral',
    0.58,
    NULL,
    0,
    true,
    'good',
    'ok',
    NULL,
    'Matthew recorded 8,789 steps with consistent activity throughout the day. Sleep: 6.9 hours total (79 sleep score) including 2.1 hours deep sleep. Oxygen saturation: 97%. Resting heart rate: 70 bpm.',
    ARRAY['Consistent activity level', 'Good deep sleep', 'Normal oxygen levels'],
    NULL,
    0,
    NULL
  ) ON CONFLICT (patient_id, summary_date) DO NOTHING;

  -- Oct 20 (Today) - Current day
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
    '2025-10-20',
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
    'Matthew is having an active day with 7,123 steps so far (ongoing). Heart rate patterns show good variability. Blood pressure this morning: 118/75 mmHg (excellent). All vitals within normal ranges.',
    ARRAY['Excellent blood pressure', 'Active morning', 'Good heart rate variability'],
    NULL,
    0,
    NULL
  ) ON CONFLICT (patient_id, summary_date) DO NOTHING;

  RAISE NOTICE 'Recent daily summaries added successfully!';

END $$;

-- Verification
SELECT
  summary_date,
  overall_mood,
  overall_status,
  LEFT(summary_text, 60) || '...' as summary_preview
FROM public.daily_summaries
WHERE patient_id = (SELECT id FROM public.profiles WHERE email = 'matthew.snow2@gmail.com')
  AND summary_date >= '2025-10-18'
ORDER BY summary_date DESC;
