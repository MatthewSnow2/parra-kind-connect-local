-- =====================================================
-- ENHANCED SAMPLE DATA FOR THREE SENIORS
-- =====================================================
-- This migration adds comprehensive sample data for:
-- 1. Dorothy Williams (healthy senior, good metrics)
-- 2. Margaret Smith (some concerns, medium risk)
-- 3. Robert Johnson (multiple issues, higher risk)
--
-- Run this to populate 7-14 days of varied historical data
-- IDEMPOTENT: Can be run multiple times without errors

-- =====================================================
-- CLEAR EXISTING DATA FOR THESE SENIORS ONLY
-- =====================================================

DELETE FROM public.activity_log WHERE user_id IN (
  '33333333-3333-3333-3333-333333333333',  -- Dorothy
  '11111111-1111-1111-1111-111111111111',  -- Margaret
  '22222222-2222-2222-2222-222222222222'   -- Robert
);

DELETE FROM public.alerts WHERE patient_id IN (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

DELETE FROM public.caregiver_notes WHERE patient_id IN (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

DELETE FROM public.daily_summaries WHERE patient_id IN (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

DELETE FROM public.check_ins WHERE patient_id IN (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

-- =====================================================
-- DOROTHY WILLIAMS - HEALTHY SENIOR (Good Metrics)
-- =====================================================

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

-- =====================================================
-- MARGARET SMITH - MEDIUM RISK (Some Concerns)
-- =====================================================

-- Margaret's Check-ins (2-3 per day, mixed emotions)
INSERT INTO public.check_ins (patient_id, interaction_type, started_at, ended_at, messages, sentiment_score, mood_detected, topics_discussed, safety_concern_detected, safety_concern_type, safety_concern_details)
VALUES
  -- Day 0 (Today) - medication concern
  ('11111111-1111-1111-1111-111111111111', 'text', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 50 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Good morning, Maggie! Did you take your blood pressure medication?', 'timestamp', (NOW() - INTERVAL '3 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Oh! I forgot. Let me take it now.', 'timestamp', (NOW() - INTERVAL '2 hours 57 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'No problem. Make sure to take it with food.', 'timestamp', (NOW() - INTERVAL '2 hours 55 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Will do. Thanks for the reminder!', 'timestamp', (NOW() - INTERVAL '2 hours 50 minutes')::TEXT)
   ), 0.45, 'neutral', ARRAY['medication', 'reminder'], true, 'missed_medication',
   'Patient forgot morning blood pressure medication. Reminded and confirmed taken.'),

  ('11111111-1111-1111-1111-111111111111', 'voice', NOW() - INTERVAL '9 hours', NOW() - INTERVAL '8 hours 52 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Hi Maggie, how are you feeling this afternoon?', 'timestamp', (NOW() - INTERVAL '9 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'A bit tired. My knees are bothering me today.', 'timestamp', (NOW() - INTERVAL '8 hours 56 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'I''m sorry to hear that. On a scale of 1-10, how bad is the pain?', 'timestamp', (NOW() - INTERVAL '8 hours 54 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Maybe a 5 or 6. Not terrible, just annoying.', 'timestamp', (NOW() - INTERVAL '8 hours 52 minutes')::TEXT)
   ), 0.30, 'concerned', ARRAY['pain', 'physical_health', 'joints'], false, NULL, NULL),

  -- Day 1 - sleep issues
  ('11111111-1111-1111-1111-111111111111', 'whatsapp', NOW() - INTERVAL '1 day 4 hours', NOW() - INTERVAL '1 day 3 hours 48 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Good morning! How did you sleep?', 'timestamp', (NOW() - INTERVAL '1 day 4 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Not great. Woke up several times during the night.', 'timestamp', (NOW() - INTERVAL '1 day 3 hours 56 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'That must be frustrating. Any idea why?', 'timestamp', (NOW() - INTERVAL '1 day 3 hours 53 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'My knees were hurting. Had trouble getting comfortable.', 'timestamp', (NOW() - INTERVAL '1 day 3 hours 48 minutes')::TEXT)
   ), 0.25, 'concerned', ARRAY['sleep', 'pain', 'discomfort'], false, NULL, NULL),

  -- Day 2 - better day
  ('11111111-1111-1111-1111-111111111111', 'voice', NOW() - INTERVAL '2 days 5 hours', NOW() - INTERVAL '2 days 4 hours 54 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Hi Maggie, how are you today?', 'timestamp', (NOW() - INTERVAL '2 days 5 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Better! The pain cream helped. I slept better last night.', 'timestamp', (NOW() - INTERVAL '2 days 4 hours 58 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'That''s good to hear! Any plans today?', 'timestamp', (NOW() - INTERVAL '2 days 4 hours 56 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'My neighbor invited me for tea this afternoon.', 'timestamp', (NOW() - INTERVAL '2 days 4 hours 54 minutes')::TEXT)
   ), 0.68, 'neutral', ARRAY['pain_improvement', 'sleep', 'social'], false, NULL, NULL),

  -- Day 3 - anxiety about appointment
  ('11111111-1111-1111-1111-111111111111', 'text', NOW() - INTERVAL '3 days 6 hours', NOW() - INTERVAL '3 days 5 hours 46 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Good morning Maggie!', 'timestamp', (NOW() - INTERVAL '3 days 6 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Hi. I''m a bit nervous about my doctor appointment tomorrow.', 'timestamp', (NOW() - INTERVAL '3 days 5 hours 54 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'It''s normal to feel anxious. What are you worried about?', 'timestamp', (NOW() - INTERVAL '3 days 5 hours 50 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'My blood pressure readings have been a bit high lately.', 'timestamp', (NOW() - INTERVAL '3 days 5 hours 46 minutes')::TEXT)
   ), 0.20, 'anxious', ARRAY['anxiety', 'health_concern', 'appointment'], false, NULL, NULL),

  -- Day 4 - post-appointment relief
  ('11111111-1111-1111-1111-111111111111', 'voice', NOW() - INTERVAL '4 days 4 hours', NOW() - INTERVAL '4 days 3 hours 53 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'How did your doctor appointment go?', 'timestamp', (NOW() - INTERVAL '4 days 4 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Better than expected! Doc adjusted my medication and said I''m doing okay.', 'timestamp', (NOW() - INTERVAL '4 days 3 hours 57 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'That''s wonderful news!', 'timestamp', (NOW() - INTERVAL '4 days 3 hours 55 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Yes, I feel relieved. Just need to monitor things closely.', 'timestamp', (NOW() - INTERVAL '4 days 3 hours 53 minutes')::TEXT)
   ), 0.75, 'happy', ARRAY['appointment', 'medication', 'relief'], false, NULL, NULL);

-- Margaret's Daily Summaries (Variable status) - USING UPSERT
INSERT INTO public.daily_summaries (patient_id, summary_date, check_in_count, total_conversation_minutes, overall_mood, average_sentiment_score, medication_taken, meals_reported, activity_reported, sleep_quality, overall_status, status_reason, summary_text, highlights, concerns, alerts_triggered, alert_types)
VALUES
  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE, 2, 18, 'concerned', 0.38, true, 2, false, 'fair', 'warning', 'Medication delay and pain reported',
   'Margaret forgot her morning medication but took it after reminder. Reported knee pain level 5-6. Limited activity due to discomfort.',
   ARRAY['Responded to medication reminder'], ARRAY['Forgot morning medication', 'Knee pain level 5-6', 'Low activity'], 1, ARRAY['missed_medication']),

  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - 1, 1, 12, 'concerned', 0.25, true, 1, false, 'poor', 'warning', 'Sleep disruption due to pain',
   'Margaret had poor sleep due to knee pain. Woke multiple times during night. Pain affecting sleep quality.',
   NULL, ARRAY['Poor sleep quality', 'Pain affecting rest', 'Low appetite'], 0, NULL),

  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - 2, 1, 6, 'neutral', 0.68, true, 2, true, 'good', 'ok', NULL,
   'Margaret felt better after using pain cream. Improved sleep. Social visit with neighbor planned.',
   ARRAY['Pain improvement', 'Better sleep', 'Social engagement'], NULL, 0, NULL),

  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - 3, 1, 14, 'anxious', 0.20, true, 2, false, 'fair', 'warning', 'Pre-appointment anxiety',
   'Margaret expressed anxiety about upcoming doctor appointment. Concerned about elevated blood pressure readings.',
   NULL, ARRAY['Health anxiety', 'Blood pressure concerns'], 0, NULL),

  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - 4, 1, 7, 'happy', 0.75, true, 3, true, 'good', 'ok', NULL,
   'Margaret had successful doctor appointment. Medication adjusted. She feels relieved and more positive.',
   ARRAY['Doctor visit completed', 'Medication adjustment', 'Emotional relief', 'Good appetite'], NULL, 0, NULL)
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
  status_reason = EXCLUDED.status_reason,
  summary_text = EXCLUDED.summary_text,
  highlights = EXCLUDED.highlights,
  concerns = EXCLUDED.concerns,
  alerts_triggered = EXCLUDED.alerts_triggered,
  alert_types = EXCLUDED.alert_types,
  updated_at = NOW();

-- Margaret's Alerts (Medium severity)
INSERT INTO public.alerts (patient_id, check_in_id, alert_type, severity, alert_message, alert_details, status, notified_caregivers, notification_sent_at, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111',
   (SELECT id FROM public.check_ins WHERE patient_id = '11111111-1111-1111-1111-111111111111'
    AND safety_concern_detected = true ORDER BY started_at DESC LIMIT 1),
   'medication_missed', 'medium',
   'Margaret forgot morning blood pressure medication',
   '{"medication": "Blood pressure medication", "delay_hours": 2, "action_taken": "Reminded patient, medication taken"}'::jsonb,
   'resolved', ARRAY['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'], NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),

  ('11111111-1111-1111-1111-111111111111', NULL, 'health_concern', 'medium',
   'Persistent knee pain affecting sleep quality',
   '{"symptom": "knee pain", "pain_level": "5-6/10", "duration": "2 days", "impact": "Sleep disruption"}'::jsonb,
   'acknowledged', ARRAY['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'], NOW() - INTERVAL '1 day',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW() - INTERVAL '18 hours', NOW() - INTERVAL '1 day');

-- Margaret's Caregiver Notes (Mix of routine and concerns)
INSERT INTO public.caregiver_notes (patient_id, caregiver_id, note_type, note_text, shared_with_patient)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'concern',
   'Mom forgot her BP medication this morning. This is the second time this month. May need to look into a pill organizer with alarms.',
   false),

  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'concern',
   'Knee pain has been ongoing for about a week now. Doctor adjusted arthritis medication at last appointment. Monitoring to see if new dosage helps.',
   false),

  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'medication',
   'New prescription: Increased arthritis medication dosage. Start date: ' || (CURRENT_DATE - 4)::TEXT || '. Monitor for side effects.',
   true),

  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'general',
   'Mom seemed more relaxed after doctor visit. Good to see her anxiety level down. She responded well to the reassurance.',
   false);

-- =====================================================
-- ROBERT JOHNSON - HIGHER RISK (Multiple Issues)
-- =====================================================

-- Robert's Check-ins (1-2 per day, often concerning)
INSERT INTO public.check_ins (patient_id, interaction_type, started_at, ended_at, messages, sentiment_score, mood_detected, topics_discussed, safety_concern_detected, safety_concern_type, safety_concern_details, alert_sent, alert_sent_at)
VALUES
  -- Day 0 (Today) - Missed check-in (no entry for morning)
  ('22222222-2222-2222-2222-222222222222', 'text', NOW() - INTERVAL '14 hours', NOW() - INTERVAL '13 hours 48 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Good evening Bob. You missed your morning check-in. Is everything okay?', 'timestamp', (NOW() - INTERVAL '14 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Sorry. I wasn''t feeling well this morning.', 'timestamp', (NOW() - INTERVAL '13 hours 56 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'I''m sorry to hear that. What''s bothering you?', 'timestamp', (NOW() - INTERVAL '13 hours 52 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Just very tired and weak. Didn''t eat much today.', 'timestamp', (NOW() - INTERVAL '13 hours 48 minutes')::TEXT)
   ), 0.15, 'concerned', ARRAY['fatigue', 'weakness', 'appetite', 'missed_checkin'], true, 'prolonged_inactivity',
   'Patient missed morning check-in. Reports fatigue, weakness, and poor appetite. Limited food intake.', true, NOW() - INTERVAL '13 hours 48 minutes'),

  -- Day 1 - Confusion reported
  ('22222222-2222-2222-2222-222222222222', 'voice', NOW() - INTERVAL '1 day 6 hours', NOW() - INTERVAL '1 day 5 hours 43 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Good morning Bob. How are you feeling?', 'timestamp', (NOW() - INTERVAL '1 day 6 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'A bit confused. I couldn''t remember if I took my morning pills.', 'timestamp', (NOW() - INTERVAL '1 day 5 hours 56 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'Let''s check your pill organizer together. Can you see it?', 'timestamp', (NOW() - INTERVAL '1 day 5 hours 52 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Yes... it looks like I did take them. But I really don''t remember.', 'timestamp', (NOW() - INTERVAL '1 day 5 hours 43 minutes')::TEXT)
   ), 0.10, 'confused', ARRAY['confusion', 'medication', 'memory'], true, 'health_concern',
   'Patient reports confusion and memory issues regarding medication. Confirmed pills were taken but patient has no recollection.', true, NOW() - INTERVAL '1 day 5 hours 43 minutes'),

  -- Day 2 - Fall incident
  ('22222222-2222-2222-2222-222222222222', 'whatsapp', NOW() - INTERVAL '2 days 8 hours', NOW() - INTERVAL '2 days 7 hours 38 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Good afternoon Bob!', 'timestamp', (NOW() - INTERVAL '2 days 8 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Hi. I had a small accident. I slipped in the bathroom.', 'timestamp', (NOW() - INTERVAL '2 days 7 hours 52 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'Oh no! Are you hurt? Did you hit your head?', 'timestamp', (NOW() - INTERVAL '2 days 7 hours 48 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'No head injury. Just bruised my hip. Managed to get up okay.', 'timestamp', (NOW() - INTERVAL '2 days 7 hours 45 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'I''m alerting your daughter Emily immediately. Please sit down and rest.', 'timestamp', (NOW() - INTERVAL '2 days 7 hours 40 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Okay. Thank you.', 'timestamp', (NOW() - INTERVAL '2 days 7 hours 38 minutes')::TEXT)
   ), -0.25, 'concerned', ARRAY['fall', 'injury', 'safety', 'bathroom'], true, 'fall',
   'Patient slipped and fell in bathroom. Bruised hip but no head injury. Patient able to get up independently. Caregiver alerted.', true, NOW() - INTERVAL '2 days 7 hours 38 minutes'),

  -- Day 3 - Depression symptoms
  ('22222222-2222-2222-2222-222222222222', 'text', NOW() - INTERVAL '3 days 10 hours', NOW() - INTERVAL '3 days 9 hours 40 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'How are you doing today, Bob?', 'timestamp', (NOW() - INTERVAL '3 days 10 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Not great. I just don''t feel like doing anything.', 'timestamp', (NOW() - INTERVAL '3 days 9 hours 56 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'I hear you. Have you been feeling sad or down?', 'timestamp', (NOW() - INTERVAL '3 days 9 hours 50 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Yes. Everything feels like too much effort lately.', 'timestamp', (NOW() - INTERVAL '3 days 9 hours 40 minutes')::TEXT)
   ), -0.40, 'sad', ARRAY['depression', 'mood', 'motivation', 'mental_health'], false, NULL, NULL, NULL, NULL),

  -- Day 4 - Better day
  ('22222222-2222-2222-2222-222222222222', 'voice', NOW() - INTERVAL '4 days 5 hours', NOW() - INTERVAL '4 days 4 hours 52 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Good morning Bob! How are you today?', 'timestamp', (NOW() - INTERVAL '4 days 5 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'A bit better. My daughter visited yesterday which helped.', 'timestamp', (NOW() - INTERVAL '4 days 4 hours 57 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'I''m so glad to hear that! Did you do anything together?', 'timestamp', (NOW() - INTERVAL '4 days 4 hours 54 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'We watched some old movies. Made me feel less alone.', 'timestamp', (NOW() - INTERVAL '4 days 4 hours 52 minutes')::TEXT)
   ), 0.35, 'neutral', ARRAY['family', 'mood_improvement', 'social_support'], false, NULL, NULL, NULL, NULL);

-- Robert's Daily Summaries (Frequently alert status) - USING UPSERT
INSERT INTO public.daily_summaries (patient_id, summary_date, check_in_count, total_conversation_minutes, overall_mood, average_sentiment_score, medication_taken, meals_reported, activity_reported, sleep_quality, overall_status, status_reason, summary_text, highlights, concerns, alerts_triggered, alert_types)
VALUES
  ('22222222-2222-2222-2222-222222222222', CURRENT_DATE, 1, 12, 'concerned', 0.15, NULL, 1, false, 'not_reported', 'alert', 'Missed morning check-in, fatigue and weakness',
   'Robert missed his scheduled morning check-in. Evening check-in revealed significant fatigue, weakness, and very poor appetite. Food intake minimal. Medication status unknown.',
   NULL, ARRAY['Missed morning check-in', 'Severe fatigue', 'Weakness reported', 'Very poor appetite', 'Medication compliance unknown'], 1, ARRAY['prolonged_inactivity']),

  ('22222222-2222-2222-2222-222222222222', CURRENT_DATE - 1, 1, 17, 'confused', 0.10, true, 1, false, 'poor', 'alert', 'Confusion and memory issues',
   'Robert reported confusion about whether he took his medications. Confirmed via pill organizer that pills were taken, but he has no memory of it. Significant cognitive concern.',
   ARRAY['Medication taken (confirmed)'], ARRAY['Memory impairment', 'Confusion reported', 'No recollection of taking meds', 'Poor sleep'], 1, ARRAY['health_concern']),

  ('22222222-2222-2222-2222-222222222222', CURRENT_DATE - 2, 1, 22, 'concerned', -0.25, true, 1, false, 'fair', 'alert', 'Fall in bathroom',
   'Robert fell in bathroom after slipping. Sustained bruised hip but no head injury. Able to get up independently. Caregiver Emily alerted and visited.',
   ARRAY['No head injury', 'Able to stand independently', 'Caregiver responded'], ARRAY['Bathroom fall', 'Hip bruise', 'Fall risk elevated'], 1, ARRAY['fall_detected']),

  ('22222222-2222-2222-2222-222222222222', CURRENT_DATE - 3, 1, 20, 'sad', -0.40, true, 0, false, 'poor', 'alert', 'Depressive symptoms',
   'Robert expressed symptoms consistent with depression: lack of motivation, feelings that everything is too much effort, persistent sadness. No appetite reported.',
   NULL, ARRAY['Depression symptoms', 'Loss of motivation', 'Persistent sadness', 'No meals reported'], 0, NULL),

  ('22222222-2222-2222-2222-222222222222', CURRENT_DATE - 4, 1, 8, 'neutral', 0.35, true, 2, true, 'fair', 'warning', 'Slight mood improvement',
   'Robert reported feeling somewhat better after daughter''s visit. Watched movies together. Still subdued but less despondent.',
   ARRAY['Family visit', 'Social activity', 'Slight mood lift'], ARRAY['Still low energy', 'Requires close monitoring'], 0, NULL)
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
  status_reason = EXCLUDED.status_reason,
  summary_text = EXCLUDED.summary_text,
  highlights = EXCLUDED.highlights,
  concerns = EXCLUDED.concerns,
  alerts_triggered = EXCLUDED.alerts_triggered,
  alert_types = EXCLUDED.alert_types,
  updated_at = NOW();

-- Robert's Alerts (High severity, multiple types)
INSERT INTO public.alerts (patient_id, check_in_id, alert_type, severity, alert_message, alert_details, status, notified_caregivers, notification_sent_at, acknowledged_by, acknowledged_at, resolution_notes, created_at)
VALUES
  -- Today's alert - still active
  ('22222222-2222-2222-2222-222222222222',
   (SELECT id FROM public.check_ins WHERE patient_id = '22222222-2222-2222-2222-222222222222'
    AND started_at > NOW() - INTERVAL '1 day' ORDER BY started_at DESC LIMIT 1),
   'prolonged_inactivity', 'high',
   'Robert missed morning check-in and reports severe fatigue',
   '{"symptoms": ["fatigue", "weakness", "poor appetite"], "missed_checkin": true, "concern_level": "high"}'::jsonb,
   'active', ARRAY['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'], NOW() - INTERVAL '13 hours', NULL, NULL, NULL, NOW() - INTERVAL '13 hours'),

  -- Day 1 alert - resolved
  ('22222222-2222-2222-2222-222222222222',
   (SELECT id FROM public.check_ins WHERE patient_id = '22222222-2222-2222-2222-222222222222'
    AND mood_detected = 'confused' ORDER BY started_at DESC LIMIT 1),
   'health_concern', 'high',
   'Robert experiencing confusion and memory issues',
   '{"symptoms": ["confusion", "memory_loss"], "medication_uncertainty": true, "cognitive_concern": true}'::jsonb,
   'resolved', ARRAY['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'], NOW() - INTERVAL '1 day 5 hours 43 minutes',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '1 day 3 hours',
   'Called Dad. He seems clearer now. Possible medication side effect or morning grogginess. Will monitor closely and may consult doctor if continues.',
   NOW() - INTERVAL '1 day 5 hours 43 minutes'),

  -- Day 2 alert - fall - resolved
  ('22222222-2222-2222-2222-222222222222',
   (SELECT id FROM public.check_ins WHERE patient_id = '22222222-2222-2222-2222-222222222222'
    AND safety_concern_type = 'fall' ORDER BY started_at DESC LIMIT 1),
   'fall_detected', 'critical',
   'Robert fell in bathroom - bruised hip',
   '{"location": "bathroom", "injury": "bruised hip", "head_injury": false, "able_to_stand": true, "caregiver_notified": true}'::jsonb,
   'resolved', ARRAY['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'], NOW() - INTERVAL '2 days 7 hours 38 minutes',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '2 days 6 hours',
   'Visited Dad immediately. Bruise on hip but no other injuries. Applied ice. Installed non-slip mat in bathroom. Will follow up with doctor tomorrow.',
   NOW() - INTERVAL '2 days 7 hours 38 minutes'),

  -- Day 3 alert - depression concern - acknowledged
  ('22222222-2222-2222-2222-222222222222', NULL,
   'health_concern', 'high',
   'Robert showing signs of depression',
   '{"symptoms": ["sadness", "loss_of_motivation", "feelings_of_overwhelm"], "duration": "several_days", "mental_health_concern": true}'::jsonb,
   'acknowledged', ARRAY['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'], NOW() - INTERVAL '3 days 9 hours',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '3 days 8 hours', NULL, NOW() - INTERVAL '3 days 9 hours'),

  -- Older alert - medication missed
  ('22222222-2222-2222-2222-222222222222', NULL,
   'missed_checkin', 'medium',
   'Robert missed evening check-in',
   '{"scheduled_time": "20:00", "missed_duration_hours": 3}'::jsonb,
   'resolved', ARRAY['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'], NOW() - INTERVAL '5 days 2 hours',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '5 days 1 hour',
   'Called Dad - he fell asleep early and missed check-in. All ok.',
   NOW() - INTERVAL '5 days 2 hours');

-- Robert's Caregiver Notes (Serious concerns, close monitoring)
INSERT INTO public.caregiver_notes (patient_id, caregiver_id, note_type, note_text, shared_with_patient, is_reminder, reminder_date)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'concern',
   'Very worried about Dad. Multiple concerning incidents this week: confusion, fall, depression symptoms, missed check-ins. Need to schedule comprehensive medical evaluation ASAP.',
   false, false, NULL),

  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'concern',
   'Dad''s fall in bathroom is concerning. Installed non-slip mat but may need grab bars installed. Also considering if Dad needs more in-home support.',
   false, false, NULL),

  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'concern',
   'The confusion/memory issue yesterday was alarming. Could be medication side effect, UTI, or cognitive decline. Documenting all incidents for doctor.',
   false, false, NULL),

  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'appointment',
   'URGENT: Scheduled comprehensive evaluation with Dr. Martinez for ' || (CURRENT_DATE + 2)::TEXT || ' at 10:30 AM. Bringing list of all recent concerns.',
   true, true, CURRENT_DATE + 2),

  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'medication',
   'Review Dad''s medication list with doctor. Confusion could be related to new BP med started 2 weeks ago. Also ask about depression screening.',
   false, false, NULL),

  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'reminder',
   'Install grab bars in bathroom by end of week. Get quotes from 3 contractors. Safety is priority.',
   false, true, CURRENT_DATE + 5),

  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'general',
   'My visit yesterday seemed to lift Dad''s spirits. Need to visit more frequently. Maybe coordinate with siblings to ensure daily in-person check-ins.',
   false, false, NULL);

-- =====================================================
-- ACTIVITY LOG ENTRIES
-- =====================================================

INSERT INTO public.activity_log (user_id, activity_type, activity_description, activity_metadata, created_at)
VALUES
  -- Dorothy's activities
  ('33333333-3333-3333-3333-333333333333', 'check_in', 'Morning voice check-in completed',
   '{"mood": "happy", "duration_seconds": 300, "device": "iPhone"}'::jsonb, NOW() - INTERVAL '2 hours'),
  ('33333333-3333-3333-3333-333333333333', 'check_in', 'Afternoon text check-in completed',
   '{"mood": "happy", "duration_seconds": 300, "device": "iPhone"}'::jsonb, NOW() - INTERVAL '8 hours'),

  -- Margaret's activities
  ('11111111-1111-1111-1111-111111111111', 'check_in', 'Morning text check-in completed',
   '{"mood": "neutral", "duration_seconds": 600, "device": "Android"}'::jsonb, NOW() - INTERVAL '3 hours'),
  ('11111111-1111-1111-1111-111111111111', 'alert_sent', 'Medication missed alert sent to caregiver',
   '{"alert_type": "medication_missed", "severity": "medium", "caregiver_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}'::jsonb, NOW() - INTERVAL '3 hours'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alert_acknowledged', 'Acknowledged medication alert',
   '{"patient_id": "11111111-1111-1111-1111-111111111111", "action_taken": "Confirmed medication taken"}'::jsonb, NOW() - INTERVAL '2 hours 45 minutes'),

  -- Robert's activities (multiple alerts)
  ('22222222-2222-2222-2222-222222222222', 'check_in', 'Evening text check-in completed',
   '{"mood": "concerned", "duration_seconds": 720, "device": "Android"}'::jsonb, NOW() - INTERVAL '14 hours'),
  ('22222222-2222-2222-2222-222222222222', 'alert_sent', 'Prolonged inactivity alert sent',
   '{"alert_type": "prolonged_inactivity", "severity": "high", "caregiver_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}'::jsonb, NOW() - INTERVAL '13 hours 48 minutes'),
  ('22222222-2222-2222-2222-222222222222', 'alert_sent', 'Fall detected - critical alert',
   '{"alert_type": "fall_detected", "severity": "critical", "location": "bathroom", "caregiver_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}'::jsonb, NOW() - INTERVAL '2 days 7 hours 38 minutes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'alert_acknowledged', 'Acknowledged fall alert and visited patient',
   '{"patient_id": "22222222-2222-2222-2222-222222222222", "action_taken": "Visited immediately, applied ice, installed safety mat"}'::jsonb, NOW() - INTERVAL '2 days 6 hours'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'note_created', 'Created urgent appointment note',
   '{"patient_id": "22222222-2222-2222-2222-222222222222", "note_type": "appointment"}'::jsonb, NOW() - INTERVAL '1 day 2 hours');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Count records per senior
SELECT
  p.full_name,
  (SELECT COUNT(*) FROM public.check_ins WHERE patient_id = p.id) as check_ins,
  (SELECT COUNT(*) FROM public.daily_summaries WHERE patient_id = p.id) as daily_summaries,
  (SELECT COUNT(*) FROM public.alerts WHERE patient_id = p.id) as alerts,
  (SELECT COUNT(*) FROM public.caregiver_notes WHERE patient_id = p.id) as caregiver_notes
FROM public.profiles p
WHERE p.id IN (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
)
ORDER BY p.full_name;

-- Show current status for each senior
SELECT
  p.full_name,
  p.display_name,
  ds.overall_status,
  ds.overall_mood,
  ds.summary_text,
  (SELECT COUNT(*) FROM public.alerts WHERE patient_id = p.id AND status = 'active') as active_alerts
FROM public.profiles p
LEFT JOIN public.daily_summaries ds ON ds.patient_id = p.id AND ds.summary_date = CURRENT_DATE
WHERE p.id IN (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
)
ORDER BY CASE ds.overall_status WHEN 'alert' THEN 1 WHEN 'warning' THEN 2 WHEN 'ok' THEN 3 ELSE 4 END;
