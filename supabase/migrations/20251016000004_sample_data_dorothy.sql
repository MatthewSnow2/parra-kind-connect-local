-- =====================================================
-- SAMPLE DATA: DOROTHY WILLIAMS (Healthy Senior)
-- =====================================================
-- IDEMPOTENT: Can be run multiple times without errors

-- Clear existing data for Dorothy
DELETE FROM public.activity_log WHERE user_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM public.alerts WHERE patient_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM public.caregiver_notes WHERE patient_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM public.daily_summaries WHERE patient_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM public.check_ins WHERE patient_id = '33333333-3333-3333-3333-333333333333';

-- Dorothy's Check-ins (3-4 per day, mostly positive)
INSERT INTO public.check_ins (patient_id, interaction_type, started_at, ended_at, messages, sentiment_score, mood_detected, topics_discussed, safety_concern_detected)
VALUES
  -- Day 0 (Today)
  ('33333333-3333-3333-3333-333333333333', 'voice', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 55 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Good morning, Dottie! How did you sleep?', 'timestamp', (NOW() - INTERVAL '2 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Wonderful! I had a full 8 hours and feel refreshed.', 'timestamp', (NOW() - INTERVAL '1 hour 58 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'That''s excellent! Have you taken your morning medications?', 'timestamp', (NOW() - INTERVAL '1 hour 57 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Yes, with my breakfast. I had oatmeal with berries.', 'timestamp', (NOW() - INTERVAL '1 hour 55 minutes')::TEXT)
   ), 0.92, 'happy', ARRAY['sleep', 'medication', 'meals'], false),

  ('33333333-3333-3333-3333-333333333333', 'text', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '7 hours 55 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Hi Dottie, how''s your afternoon going?', 'timestamp', (NOW() - INTERVAL '8 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Great! Just finished my tai chi class at the senior center.', 'timestamp', (NOW() - INTERVAL '7 hours 58 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'Wonderful! How are you feeling physically?', 'timestamp', (NOW() - INTERVAL '7 hours 57 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'A bit tired but in a good way. My balance is improving!', 'timestamp', (NOW() - INTERVAL '7 hours 55 minutes')::TEXT)
   ), 0.88, 'happy', ARRAY['activity', 'exercise', 'social'], false),

  -- Day 1
  ('33333333-3333-3333-3333-333333333333', 'voice', NOW() - INTERVAL '1 day 2 hours', NOW() - INTERVAL '1 day 1 hour 53 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Good morning! How are you today?', 'timestamp', (NOW() - INTERVAL '1 day 2 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Feeling great! My grandson is visiting today.', 'timestamp', (NOW() - INTERVAL '1 day 1 hour 58 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'How lovely! Any plans?', 'timestamp', (NOW() - INTERVAL '1 day 1 hour 55 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'We''re going to the park and then lunch. I''m excited!', 'timestamp', (NOW() - INTERVAL '1 day 1 hour 53 minutes')::TEXT)
   ), 0.95, 'happy', ARRAY['family', 'social', 'mood'], false),

  ('33333333-3333-3333-3333-333333333333', 'text', NOW() - INTERVAL '1 day 20 hours', NOW() - INTERVAL '1 day 19 hours 55 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'How was your day with your grandson?', 'timestamp', (NOW() - INTERVAL '1 day 20 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'It was perfect! We had such a nice time. I''m a bit tired now though.', 'timestamp', (NOW() - INTERVAL '1 day 19 hours 57 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'That''s wonderful! Get some rest, you deserve it.', 'timestamp', (NOW() - INTERVAL '1 day 19 hours 55 minutes')::TEXT)
   ), 0.82, 'happy', ARRAY['family', 'activity', 'rest'], false),

  -- Day 2
  ('33333333-3333-3333-3333-333333333333', 'whatsapp', NOW() - INTERVAL '2 days 3 hours', NOW() - INTERVAL '2 days 2 hours 54 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Good morning Dottie!', 'timestamp', (NOW() - INTERVAL '2 days 3 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Morning! I slept so well after yesterday''s activities.', 'timestamp', (NOW() - INTERVAL '2 days 2 hours 57 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'Great to hear! How''s your energy today?', 'timestamp', (NOW() - INTERVAL '2 days 2 hours 55 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Pretty good! Taking it a bit easier today.', 'timestamp', (NOW() - INTERVAL '2 days 2 hours 54 minutes')::TEXT)
   ), 0.78, 'happy', ARRAY['sleep', 'energy', 'rest'], false),

  -- Day 3
  ('33333333-3333-3333-3333-333333333333', 'voice', NOW() - INTERVAL '3 days 4 hours', NOW() - INTERVAL '3 days 3 hours 52 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Hi Dottie, checking in!', 'timestamp', (NOW() - INTERVAL '3 days 4 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Hello! Just had a lovely phone call with my daughter.', 'timestamp', (NOW() - INTERVAL '3 days 3 hours 56 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'That''s nice! How are you feeling overall?', 'timestamp', (NOW() - INTERVAL '3 days 3 hours 54 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Feeling blessed. My health is good and family is close.', 'timestamp', (NOW() - INTERVAL '3 days 3 hours 52 minutes')::TEXT)
   ), 0.90, 'happy', ARRAY['family', 'mood', 'gratitude'], false),

  -- Day 4
  ('33333333-3333-3333-3333-333333333333', 'text', NOW() - INTERVAL '4 days 5 hours', NOW() - INTERVAL '4 days 4 hours 50 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Good afternoon! How''s your day?', 'timestamp', (NOW() - INTERVAL '4 days 5 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Good! I did some gardening this morning.', 'timestamp', (NOW() - INTERVAL '4 days 4 hours 55 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'Wonderful! How do you feel after gardening?', 'timestamp', (NOW() - INTERVAL '4 days 4 hours 52 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'A bit sore but satisfied. The roses look beautiful.', 'timestamp', (NOW() - INTERVAL '4 days 4 hours 50 minutes')::TEXT)
   ), 0.85, 'happy', ARRAY['activity', 'gardening', 'physical_health'], false);

-- Dorothy's Daily Summaries (Consistently good) - USING UPSERT
INSERT INTO public.daily_summaries (patient_id, summary_date, check_in_count, total_conversation_minutes, overall_mood, average_sentiment_score, medication_taken, meals_reported, activity_reported, sleep_quality, overall_status, summary_text, highlights)
VALUES
  ('33333333-3333-3333-3333-333333333333', CURRENT_DATE, 2, 10, 'happy', 0.90, true, 2, true, 'good', 'ok',
   'Dorothy had an excellent day with tai chi class. She reported good sleep, took all medications, and is active.',
   ARRAY['Excellent mood', 'Tai chi class completed', 'Good medication adherence', 'Quality sleep']),

  ('33333333-3333-3333-3333-333333333333', CURRENT_DATE - 1, 2, 14, 'happy', 0.89, true, 3, true, 'good', 'ok',
   'Dorothy enjoyed a wonderful visit with her grandson. They went to the park and had lunch together.',
   ARRAY['Family visit', 'High activity level', 'Social engagement', 'Positive mood']),

  ('33333333-3333-3333-3333-333333333333', CURRENT_DATE - 2, 1, 6, 'happy', 0.78, true, 2, false, 'good', 'ok',
   'Dorothy took a restful day after previous day''s activities. Good recovery and sleep.',
   ARRAY['Good rest', 'Medication compliance', 'Appropriate recovery']),

  ('33333333-3333-3333-3333-333333333333', CURRENT_DATE - 3, 1, 8, 'happy', 0.90, true, 2, true, 'good', 'ok',
   'Dorothy had a pleasant day with family phone call. She reported feeling grateful and blessed.',
   ARRAY['Family connection', 'Positive emotional state', 'Gratitude expressed']),

  ('33333333-3333-3333-3333-333333333333', CURRENT_DATE - 4, 1, 10, 'happy', 0.85, true, 2, true, 'good', 'ok',
   'Dorothy spent the morning gardening. Some physical soreness but good spirits and satisfaction.',
   ARRAY['Physical activity', 'Hobby engagement', 'Positive mood'])
ON CONFLICT (patient_id, summary_date)
DO UPDATE SET
  check_in_count = EXCLUDED.check_in_count,
  total_conversation_minutes = EXCLUDED.total_conversation_minutes,
  overall_mood = EXCLUDED.overall_mood,
  average_sentiment_score = EXCLUDED.average_sentiment_score,
  medication_taken = EXCLUDED.medication_taken,
  meals_reported = EXCLUDED.meals_reported,
  activity_reported = EXCLUDED.activity_reported,
  sleep_quality = EXCLUDED.sleep_quality,
  overall_status = EXCLUDED.overall_status,
  summary_text = EXCLUDED.summary_text,
  highlights = EXCLUDED.highlights,
  updated_at = NOW();

-- Dorothy's Caregiver Notes (Routine, positive observations)
INSERT INTO public.caregiver_notes (patient_id, caregiver_id, note_type, note_text, shared_with_patient)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'general',
   'Mom is doing wonderfully! Her participation in tai chi is really helping with balance and flexibility. Very proud of her!',
   true),

  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'appointment',
   'Reminder: Annual physical exam with Dr. Rodriguez on ' || (CURRENT_DATE + 10)::TEXT || ' at 2:00 PM.',
   true),

  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'general',
   'Grandson Tommy visited today. Mom was so happy! These social visits are really good for her mental health.',
   false);

-- Dorothy's Activity Log
INSERT INTO public.activity_log (user_id, activity_type, activity_description, activity_metadata, created_at)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'check_in', 'Morning voice check-in completed',
   '{"mood": "happy", "duration_seconds": 300, "device": "iPhone"}'::jsonb, NOW() - INTERVAL '2 hours'),
  ('33333333-3333-3333-3333-333333333333', 'check_in', 'Afternoon text check-in completed',
   '{"mood": "happy", "duration_seconds": 300, "device": "iPhone"}'::jsonb, NOW() - INTERVAL '8 hours');

-- Verification
SELECT 'Dorothy Williams' as senior_name,
  (SELECT COUNT(*) FROM public.check_ins WHERE patient_id = '33333333-3333-3333-3333-333333333333') as check_ins,
  (SELECT COUNT(*) FROM public.daily_summaries WHERE patient_id = '33333333-3333-3333-3333-333333333333') as summaries,
  (SELECT COUNT(*) FROM public.caregiver_notes WHERE patient_id = '33333333-3333-3333-3333-333333333333') as notes;
