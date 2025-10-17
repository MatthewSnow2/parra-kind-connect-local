-- =====================================================
-- SAMPLE DATA: MARGARET SMITH (Medium Risk)
-- =====================================================
-- IDEMPOTENT: Can be run multiple times without errors
-- RUN AFTER: 20251016000003_fix_mood_constraint.sql

-- Clear existing data for Margaret
DELETE FROM public.activity_log WHERE user_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.alerts WHERE patient_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.caregiver_notes WHERE patient_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.daily_summaries WHERE patient_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.check_ins WHERE patient_id = '11111111-1111-1111-1111-111111111111';

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

  -- Day 3 - anxiety about appointment (NOTE: Using 'concerned' instead of 'anxious' for now)
  ('11111111-1111-1111-1111-111111111111', 'text', NOW() - INTERVAL '3 days 6 hours', NOW() - INTERVAL '3 days 5 hours 46 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Good morning Maggie!', 'timestamp', (NOW() - INTERVAL '3 days 6 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Hi. I''m a bit nervous about my doctor appointment tomorrow.', 'timestamp', (NOW() - INTERVAL '3 days 5 hours 54 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'It''s normal to feel anxious. What are you worried about?', 'timestamp', (NOW() - INTERVAL '3 days 5 hours 50 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'My blood pressure readings have been a bit high lately.', 'timestamp', (NOW() - INTERVAL '3 days 5 hours 46 minutes')::TEXT)
   ), 0.20, 'concerned', ARRAY['anxiety', 'health_concern', 'appointment'], false, NULL, NULL),

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

  ('11111111-1111-1111-1111-111111111111', CURRENT_DATE - 3, 1, 14, 'concerned', 0.20, true, 2, false, 'fair', 'warning', 'Pre-appointment anxiety',
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
   'resolved', ARRAY['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa']::uuid[], NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),

  ('11111111-1111-1111-1111-111111111111', NULL, 'health_concern', 'medium',
   'Persistent knee pain affecting sleep quality',
   '{"symptom": "knee pain", "pain_level": "5-6/10", "duration": "2 days", "impact": "Sleep disruption"}'::jsonb,
   'acknowledged', ARRAY['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa']::uuid[], NOW() - INTERVAL '1 day',
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

-- Margaret's Activity Log
INSERT INTO public.activity_log (user_id, activity_type, activity_description, activity_metadata, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'check_in', 'Morning text check-in completed',
   '{"mood": "neutral", "duration_seconds": 600, "device": "Android"}'::jsonb, NOW() - INTERVAL '3 hours'),
  ('11111111-1111-1111-1111-111111111111', 'alert_sent', 'Medication missed alert sent to caregiver',
   '{"alert_type": "medication_missed", "severity": "medium", "caregiver_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}'::jsonb, NOW() - INTERVAL '3 hours'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alert_acknowledged', 'Acknowledged medication alert',
   '{"patient_id": "11111111-1111-1111-1111-111111111111", "action_taken": "Confirmed medication taken"}'::jsonb, NOW() - INTERVAL '2 hours 45 minutes');

-- Verification
SELECT 'Margaret Smith' as senior_name,
  (SELECT COUNT(*) FROM public.check_ins WHERE patient_id = '11111111-1111-1111-1111-111111111111') as check_ins,
  (SELECT COUNT(*) FROM public.daily_summaries WHERE patient_id = '11111111-1111-1111-1111-111111111111') as summaries,
  (SELECT COUNT(*) FROM public.caregiver_notes WHERE patient_id = '11111111-1111-1111-1111-111111111111') as notes,
  (SELECT COUNT(*) FROM public.alerts WHERE patient_id = '11111111-1111-1111-1111-111111111111') as alerts;
