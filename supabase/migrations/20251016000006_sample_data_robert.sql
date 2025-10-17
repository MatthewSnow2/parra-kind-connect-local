-- =====================================================
-- SAMPLE DATA: ROBERT JOHNSON (Higher Risk)
-- =====================================================
-- IDEMPOTENT: Can be run multiple times without errors
-- RUN AFTER: 20251016000003_fix_mood_constraint.sql

-- Clear existing data for Robert
DELETE FROM public.activity_log WHERE user_id = '22222222-2222-2222-2222-222222222222';
DELETE FROM public.alerts WHERE patient_id = '22222222-2222-2222-2222-222222222222';
DELETE FROM public.caregiver_notes WHERE patient_id = '22222222-2222-2222-2222-222222222222';
DELETE FROM public.daily_summaries WHERE patient_id = '22222222-2222-2222-2222-222222222222';
DELETE FROM public.check_ins WHERE patient_id = '22222222-2222-2222-2222-222222222222';

-- Robert's Check-ins (1-2 per day, often concerning)
INSERT INTO public.check_ins (patient_id, interaction_type, started_at, ended_at, messages, sentiment_score, mood_detected, topics_discussed, safety_concern_detected, safety_concern_type, safety_concern_details, alert_sent, alert_sent_at)
VALUES
  -- Day 0 (Today) - Missed check-in
  ('22222222-2222-2222-2222-222222222222', 'text', NOW() - INTERVAL '14 hours', NOW() - INTERVAL '13 hours 48 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Good evening Bob. You missed your morning check-in. Is everything okay?', 'timestamp', (NOW() - INTERVAL '14 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Sorry. I wasn''t feeling well this morning.', 'timestamp', (NOW() - INTERVAL '13 hours 56 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'I''m sorry to hear that. What''s bothering you?', 'timestamp', (NOW() - INTERVAL '13 hours 52 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Just very tired and weak. Didn''t eat much today.', 'timestamp', (NOW() - INTERVAL '13 hours 48 minutes')::TEXT)
   ), 0.15, 'concerned', ARRAY['fatigue', 'weakness', 'appetite', 'missed_checkin'], true, 'inactivity',
   'Patient missed morning check-in. Reports fatigue, weakness, and poor appetite. Limited food intake.', true, NOW() - INTERVAL '13 hours 48 minutes'),

  -- Day 1 - Confusion reported (NOTE: Using 'concerned' instead of 'confused' for now)
  ('22222222-2222-2222-2222-222222222222', 'voice', NOW() - INTERVAL '1 day 6 hours', NOW() - INTERVAL '1 day 5 hours 43 minutes',
   jsonb_build_array(
     jsonb_build_object('role', 'assistant', 'content', 'Good morning Bob. How are you feeling?', 'timestamp', (NOW() - INTERVAL '1 day 6 hours')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'A bit confused. I couldn''t remember if I took my morning pills.', 'timestamp', (NOW() - INTERVAL '1 day 5 hours 56 minutes')::TEXT),
     jsonb_build_object('role', 'assistant', 'content', 'Let''s check your pill organizer together. Can you see it?', 'timestamp', (NOW() - INTERVAL '1 day 5 hours 52 minutes')::TEXT),
     jsonb_build_object('role', 'user', 'content', 'Yes... it looks like I did take them. But I really don''t remember.', 'timestamp', (NOW() - INTERVAL '1 day 5 hours 43 minutes')::TEXT)
   ), 0.10, 'concerned', ARRAY['confusion', 'medication', 'memory'], true, 'medical',
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
   NULL, ARRAY['Missed morning check-in', 'Severe fatigue', 'Weakness reported', 'Very poor appetite', 'Medication compliance unknown'], 1, ARRAY['missed_checkin']),

  ('22222222-2222-2222-2222-222222222222', CURRENT_DATE - 1, 1, 17, 'concerned', 0.10, true, 1, false, 'poor', 'alert', 'Confusion and memory issues',
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
   'missed_checkin', 'high',
   'Robert missed morning check-in and reports severe fatigue',
   '{"symptoms": ["fatigue", "weakness", "poor appetite"], "missed_checkin": true, "concern_level": "high"}'::jsonb,
   'active', ARRAY['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb']::uuid[], NOW() - INTERVAL '13 hours', NULL, NULL, NULL, NOW() - INTERVAL '13 hours'),

  -- Day 1 alert - resolved
  ('22222222-2222-2222-2222-222222222222',
   (SELECT id FROM public.check_ins WHERE patient_id = '22222222-2222-2222-2222-222222222222'
    AND safety_concern_type = 'medical' ORDER BY started_at DESC LIMIT 1),
   'health_concern', 'high',
   'Robert experiencing confusion and memory issues',
   '{"symptoms": ["confusion", "memory_loss"], "medication_uncertainty": true, "cognitive_concern": true}'::jsonb,
   'resolved', ARRAY['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb']::uuid[], NOW() - INTERVAL '1 day 5 hours 43 minutes',
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
   'resolved', ARRAY['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb']::uuid[], NOW() - INTERVAL '2 days 7 hours 38 minutes',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '2 days 6 hours',
   'Visited Dad immediately. Bruise on hip but no other injuries. Applied ice. Installed non-slip mat in bathroom. Will follow up with doctor tomorrow.',
   NOW() - INTERVAL '2 days 7 hours 38 minutes'),

  -- Day 3 alert - depression concern - acknowledged
  ('22222222-2222-2222-2222-222222222222', NULL,
   'health_concern', 'high',
   'Robert showing signs of depression',
   '{"symptoms": ["sadness", "loss_of_motivation", "feelings_of_overwhelm"], "duration": "several_days", "mental_health_concern": true}'::jsonb,
   'acknowledged', ARRAY['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb']::uuid[], NOW() - INTERVAL '3 days 9 hours',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW() - INTERVAL '3 days 8 hours', NULL, NOW() - INTERVAL '3 days 9 hours'),

  -- Older alert - medication missed
  ('22222222-2222-2222-2222-222222222222', NULL,
   'missed_checkin', 'medium',
   'Robert missed evening check-in',
   '{"scheduled_time": "20:00", "missed_duration_hours": 3}'::jsonb,
   'resolved', ARRAY['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb']::uuid[], NOW() - INTERVAL '5 days 2 hours',
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

-- Robert's Activity Log
INSERT INTO public.activity_log (user_id, activity_type, activity_description, activity_metadata, created_at)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'check_in', 'Evening text check-in completed',
   '{"mood": "concerned", "duration_seconds": 720, "device": "Android"}'::jsonb, NOW() - INTERVAL '14 hours'),
  ('22222222-2222-2222-2222-222222222222', 'alert_sent', 'Missed check-in alert sent',
   '{"alert_type": "missed_checkin", "severity": "high", "caregiver_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}'::jsonb, NOW() - INTERVAL '13 hours 48 minutes'),
  ('22222222-2222-2222-2222-222222222222', 'alert_sent', 'Fall detected - critical alert',
   '{"alert_type": "fall_detected", "severity": "critical", "location": "bathroom", "caregiver_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}'::jsonb, NOW() - INTERVAL '2 days 7 hours 38 minutes'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'alert_acknowledged', 'Acknowledged fall alert and visited patient',
   '{"patient_id": "22222222-2222-2222-2222-222222222222", "action_taken": "Visited immediately, applied ice, installed safety mat"}'::jsonb, NOW() - INTERVAL '2 days 6 hours'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'note_created', 'Created urgent appointment note',
   '{"patient_id": "22222222-2222-2222-2222-222222222222", "note_type": "appointment"}'::jsonb, NOW() - INTERVAL '1 day 2 hours');

-- Verification
SELECT 'Robert Johnson' as senior_name,
  (SELECT COUNT(*) FROM public.check_ins WHERE patient_id = '22222222-2222-2222-2222-222222222222') as check_ins,
  (SELECT COUNT(*) FROM public.daily_summaries WHERE patient_id = '22222222-2222-2222-2222-222222222222') as summaries,
  (SELECT COUNT(*) FROM public.caregiver_notes WHERE patient_id = '22222222-2222-2222-2222-222222222222') as notes,
  (SELECT COUNT(*) FROM public.alerts WHERE patient_id = '22222222-2222-2222-2222-222222222222') as alerts;
