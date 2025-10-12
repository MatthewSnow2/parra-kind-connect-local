-- =====================================================
-- PARRA CONNECT - MOCK DATA SEED
-- =====================================================
-- This migration creates realistic test data for development
-- Run this AFTER the core schema migration

-- NOTE: In production, you would create users through Supabase Auth signup
-- For testing, we'll create profile records with placeholder IDs

-- =====================================================
-- 1. CREATE TEST PROFILES
-- =====================================================

-- Senior/Patient profiles
INSERT INTO public.profiles (id, email, full_name, display_name, role, phone_number, date_of_birth, emergency_contact_name, emergency_contact_phone, created_at, updated_at, last_active_at)
VALUES
  -- Margaret Smith (78 years old, status: OK)
  ('11111111-1111-1111-1111-111111111111', 'margaret.smith@example.com', 'Margaret Smith', 'Maggie', 'senior', '+14155551001', '1947-03-15', 'Susan Miller', '+14155552001', NOW() - INTERVAL '90 days', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),

  -- Robert Johnson (82 years old, status: WARNING)
  ('22222222-2222-2222-2222-222222222222', 'robert.johnson@example.com', 'Robert Johnson', 'Bob', 'senior', '+14155551002', '1943-07-22', 'Emily Johnson', '+14155552002', NOW() - INTERVAL '120 days', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),

  -- Dorothy Williams (75 years old, status: ALERT)
  ('33333333-3333-3333-3333-333333333333', 'dorothy.williams@example.com', 'Dorothy Williams', 'Dottie', 'senior', '+14155551003', '1950-11-08', 'Michael Williams', '+14155552003', NOW() - INTERVAL '60 days', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO NOTHING;

-- Caregiver profiles
INSERT INTO public.profiles (id, email, full_name, display_name, role, phone_number, created_at, updated_at, last_active_at)
VALUES
  -- Susan Miller (Margaret's daughter)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'susan.miller@example.com', 'Susan Miller', 'Susan', 'caregiver', '+14155552001', NOW() - INTERVAL '90 days', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),

  -- Emily Johnson (Robert's daughter)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'emily.johnson@example.com', 'Emily Johnson', 'Emily', 'caregiver', '+14155552002', NOW() - INTERVAL '120 days', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),

  -- Michael Williams (Dorothy's son)
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'michael.williams@example.com', 'Michael Williams', 'Mike', 'caregiver', '+14155552003', NOW() - INTERVAL '60 days', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. CREATE CARE RELATIONSHIPS
-- =====================================================

INSERT INTO public.care_relationships (patient_id, caregiver_id, relationship_type, relationship_label, can_view_health_data, can_receive_alerts, can_modify_settings, status, accepted_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'primary_caregiver', 'Daughter', true, true, true, 'active', NOW() - INTERVAL '90 days'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'primary_caregiver', 'Daughter', true, true, true, 'active', NOW() - INTERVAL '120 days'),
  ('33333333-3333-3333-3333-333333333333', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'primary_caregiver', 'Son', true, true, true, 'active', NOW() - INTERVAL '60 days')
ON CONFLICT (patient_id, caregiver_id) DO NOTHING;

-- =====================================================
-- 3. CREATE CHECK-INS (CONVERSATION HISTORY)
-- =====================================================

-- Margaret Smith - Recent check-ins (status OK)
INSERT INTO public.check_ins (patient_id, interaction_type, started_at, ended_at, messages, sentiment_score, mood_detected, topics_discussed, safety_concern_detected)
VALUES
  -- Today's morning check-in
  (
    '11111111-1111-1111-1111-111111111111',
    'text',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 55 minutes',
    '[
      {"role": "assistant", "content": "Good morning, Maggie! How are you feeling today?", "timestamp": "'|| (NOW() - INTERVAL '2 hours')::TEXT ||'"},
      {"role": "user", "content": "Good morning! I''m feeling wonderful today. Had a great night''s sleep.", "timestamp": "'|| (NOW() - INTERVAL '1 hour 58 minutes')::TEXT ||'"},
      {"role": "assistant", "content": "That''s wonderful to hear! Did you take your morning medication?", "timestamp": "'|| (NOW() - INTERVAL '1 hour 57 minutes')::TEXT ||'"},
      {"role": "user", "content": "Yes, I took my blood pressure pill with breakfast.", "timestamp": "'|| (NOW() - INTERVAL '1 hour 56 minutes')::TEXT ||'"},
      {"role": "assistant", "content": "Perfect! Any plans for today?", "timestamp": "'|| (NOW() - INTERVAL '1 hour 56 minutes')::TEXT ||'"},
      {"role": "user", "content": "I''m thinking about taking a short walk in the garden later.", "timestamp": "'|| (NOW() - INTERVAL '1 hour 55 minutes')::TEXT ||'"}
    ]'::jsonb,
    0.85,
    'happy',
    ARRAY['medication', 'sleep', 'activity'],
    false
  ),

  -- Yesterday evening check-in
  (
    '11111111-1111-1111-1111-111111111111',
    'voice',
    NOW() - INTERVAL '1 day 18 hours',
    NOW() - INTERVAL '1 day 17 hours 52 minutes',
    '[
      {"role": "assistant", "content": "Good evening, Maggie. How was your day?", "timestamp": "'|| (NOW() - INTERVAL '1 day 18 hours')::TEXT ||'"},
      {"role": "user", "content": "It was lovely. I had lunch with my neighbor and we played cards.", "timestamp": "'|| (NOW() - INTERVAL '1 day 17 hours 58 minutes')::TEXT ||'"},
      {"role": "assistant", "content": "That sounds delightful! How are you feeling now?", "timestamp": "'|| (NOW() - INTERVAL '1 day 17 hours 56 minutes')::TEXT ||'"},
      {"role": "user", "content": "A bit tired, but in a good way. Ready for bed soon.", "timestamp": "'|| (NOW() - INTERVAL '1 day 17 hours 52 minutes')::TEXT ||'"}
    ]'::jsonb,
    0.75,
    'happy',
    ARRAY['social', 'meals', 'mood'],
    false
  );

-- Robert Johnson - Recent check-ins (status WARNING - missed evening check-in)
INSERT INTO public.check_ins (patient_id, interaction_type, started_at, ended_at, messages, sentiment_score, mood_detected, topics_discussed, safety_concern_detected)
VALUES
  -- Morning check-in (5 hours ago)
  (
    '22222222-2222-2222-2222-222222222222',
    'whatsapp',
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '4 hours 50 minutes',
    '[
      {"role": "assistant", "content": "Good morning, Bob! How did you sleep?", "timestamp": "'|| (NOW() - INTERVAL '5 hours')::TEXT ||'"},
      {"role": "user", "content": "Not great. Woke up a few times during the night.", "timestamp": "'|| (NOW() - INTERVAL '4 hours 58 minutes')::TEXT ||'"},
      {"role": "assistant", "content": "I''m sorry to hear that. Have you had breakfast?", "timestamp": "'|| (NOW() - INTERVAL '4 hours 56 minutes')::TEXT ||'"},
      {"role": "user", "content": "Just some toast. Not very hungry this morning.", "timestamp": "'|| (NOW() - INTERVAL '4 hours 50 minutes')::TEXT ||'"}
    ]'::jsonb,
    0.35,
    'neutral',
    ARRAY['sleep', 'meals', 'mood'],
    false
  ),

  -- Yesterday - reported feeling tired
  (
    '22222222-2222-2222-2222-222222222222',
    'text',
    NOW() - INTERVAL '1 day 6 hours',
    NOW() - INTERVAL '1 day 5 hours 45 minutes',
    '[
      {"role": "assistant", "content": "Hi Bob, checking in. How''s your day going?", "timestamp": "'|| (NOW() - INTERVAL '1 day 6 hours')::TEXT ||'"},
      {"role": "user", "content": "Feeling pretty tired today. Didn''t do much.", "timestamp": "'|| (NOW() - INTERVAL '1 day 5 hours 55 minutes')::TEXT ||'"},
      {"role": "assistant", "content": "It''s okay to have slower days. Did you take your medications?", "timestamp": "'|| (NOW() - INTERVAL '1 day 5 hours 52 minutes')::TEXT ||'"},
      {"role": "user", "content": "Yes, I remembered.", "timestamp": "'|| (NOW() - INTERVAL '1 day 5 hours 45 minutes')::TEXT ||'"}
    ]'::jsonb,
    0.25,
    'neutral',
    ARRAY['medication', 'energy', 'activity'],
    false
  );

-- Dorothy Williams - Recent check-ins (status ALERT - concerning message)
INSERT INTO public.check_ins (patient_id, interaction_type, started_at, ended_at, messages, sentiment_score, mood_detected, topics_discussed, safety_concern_detected, safety_concern_type, safety_concern_details, alert_sent, alert_sent_at)
VALUES
  -- This morning - reported feeling dizzy
  (
    '33333333-3333-3333-3333-333333333333',
    'text',
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '11 hours 50 minutes',
    '[
      {"role": "assistant", "content": "Good morning, Dottie. How are you today?", "timestamp": "'|| (NOW() - INTERVAL '12 hours')::TEXT ||'"},
      {"role": "user", "content": "I''m feeling a bit dizzy when I stand up.", "timestamp": "'|| (NOW() - INTERVAL '11 hours 58 minutes')::TEXT ||'"},
      {"role": "assistant", "content": "I''m concerned about that. Can you sit down for me? Have you fallen or hurt yourself?", "timestamp": "'|| (NOW() - INTERVAL '11 hours 57 minutes')::TEXT ||'"},
      {"role": "user", "content": "No, I haven''t fallen. Just feel lightheaded.", "timestamp": "'|| (NOW() - INTERVAL '11 hours 55 minutes')::TEXT ||'"},
      {"role": "assistant", "content": "Okay, I''m going to notify your son Michael. Can you stay seated and drink some water?", "timestamp": "'|| (NOW() - INTERVAL '11 hours 54 minutes')::TEXT ||'"},
      {"role": "user", "content": "Yes, I''ll sit here.", "timestamp": "'|| (NOW() - INTERVAL '11 hours 50 minutes')::TEXT ||'"}
    ]'::jsonb,
    -0.15,
    'concerned',
    ARRAY['health', 'symptoms', 'safety'],
    true,
    'health_concern',
    'Patient reported feeling dizzy when standing up. Advised to sit down and drink water. No falls reported.',
    true,
    NOW() - INTERVAL '11 hours 50 minutes'
  ),

  -- Yesterday - skipped evening check-in (no record, contributing to ALERT status)

  -- Two days ago - normal check-in
  (
    '33333333-3333-3333-3333-333333333333',
    'voice',
    NOW() - INTERVAL '2 days 10 hours',
    NOW() - INTERVAL '2 days 9 hours 55 minutes',
    '[
      {"role": "assistant", "content": "Hi Dottie, how are you feeling?", "timestamp": "'|| (NOW() - INTERVAL '2 days 10 hours')::TEXT ||'"},
      {"role": "user", "content": "I''m doing okay. A bit tired but that''s normal.", "timestamp": "'|| (NOW() - INTERVAL '2 days 9 hours 58 minutes')::TEXT ||'"},
      {"role": "assistant", "content": "That''s understandable. How''s your appetite?", "timestamp": "'|| (NOW() - INTERVAL '2 days 9 hours 56 minutes')::TEXT ||'"},
      {"role": "user", "content": "Pretty good. Had a nice soup for lunch.", "timestamp": "'|| (NOW() - INTERVAL '2 days 9 hours 55 minutes')::TEXT ||'"}
    ]'::jsonb,
    0.45,
    'neutral',
    ARRAY['mood', 'meals', 'energy'],
    false
  );

-- =====================================================
-- 4. CREATE DAILY SUMMARIES
-- =====================================================

-- Margaret Smith - Daily summaries (last 7 days)
INSERT INTO public.daily_summaries (patient_id, summary_date, check_in_count, total_conversation_minutes, overall_mood, average_sentiment_score, medication_taken, meals_reported, activity_reported, sleep_quality, overall_status, summary_text, highlights)
VALUES
  -- Today
  (
    '11111111-1111-1111-1111-111111111111',
    CURRENT_DATE,
    1,
    5,
    'happy',
    0.85,
    true,
    1,
    true,
    'good',
    'ok',
    'Maggie had a great morning check-in. She slept well, took her medication on time, and is planning a walk in the garden.',
    ARRAY['Excellent mood and energy', 'Medication adherence', 'Planning physical activity']
  ),

  -- Yesterday
  (
    '11111111-1111-1111-1111-111111111111',
    CURRENT_DATE - INTERVAL '1 day',
    2,
    13,
    'happy',
    0.80,
    true,
    3,
    true,
    'good',
    'ok',
    'Maggie had a wonderful day with social activities. She played cards with her neighbor and reported feeling tired in a good way.',
    ARRAY['Good social engagement', 'Multiple meals', 'Positive mood throughout day']
  ),

  -- 2 days ago
  (
    '11111111-1111-1111-1111-111111111111',
    CURRENT_DATE - INTERVAL '2 days',
    2,
    11,
    'happy',
    0.78,
    true,
    3,
    true,
    'good',
    'ok',
    'Maggie continued her positive routine with good medication adherence and regular meals.',
    ARRAY['Consistent check-ins', 'Good appetite', 'Stable mood']
  );

-- Robert Johnson - Daily summaries (showing declining pattern)
INSERT INTO public.daily_summaries (patient_id, summary_date, check_in_count, total_conversation_minutes, overall_mood, average_sentiment_score, medication_taken, meals_reported, activity_reported, sleep_quality, overall_status, status_reason, summary_text, concerns)
VALUES
  -- Today
  (
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE,
    1,
    10,
    'neutral',
    0.35,
    true,
    1,
    false,
    'poor',
    'warning',
    'Missed evening check-in',
    'Bob reported poor sleep and reduced appetite this morning. He took his medication but hasn''t checked in this evening as scheduled.',
    ARRAY['Poor sleep quality', 'Reduced appetite', 'Missed evening check-in']
  ),

  -- Yesterday
  (
    '22222222-2222-2222-2222-222222222222',
    CURRENT_DATE - INTERVAL '1 day',
    1,
    15,
    'neutral',
    0.25,
    true,
    2,
    false,
    'fair',
    'warning',
    'Low activity and energy',
    'Bob reported feeling tired and didn''t engage in much activity. Medication adherence maintained.',
    ARRAY['Low energy levels', 'Reduced activity', 'Subdued mood']
  );

-- Dorothy Williams - Daily summaries (showing ALERT status)
INSERT INTO public.daily_summaries (patient_id, summary_date, check_in_count, total_conversation_minutes, overall_mood, average_sentiment_score, medication_taken, meals_reported, activity_reported, sleep_quality, overall_status, status_reason, summary_text, alerts_triggered, alert_types, concerns)
VALUES
  -- Today
  (
    '33333333-3333-3333-3333-333333333333',
    CURRENT_DATE,
    1,
    10,
    'concerned',
    -0.15,
    NULL,
    0,
    false,
    'not_reported',
    'alert',
    'Health concern - dizziness reported',
    'Dottie reported feeling dizzy when standing up this morning. Alert sent to caregiver Michael. She was advised to sit down and stay hydrated. No check-ins since morning.',
    1,
    ARRAY['health_concern'],
    ARRAY['Reported dizziness', 'Potential orthostatic hypotension', 'No follow-up check-in', 'Medication status unknown']
  ),

  -- Yesterday
  (
    '33333333-3333-3333-3333-333333333333',
    CURRENT_DATE - INTERVAL '1 day',
    0,
    0,
    'neutral',
    NULL,
    NULL,
    0,
    false,
    'not_reported',
    'warning',
    'No check-ins completed',
    'Dottie did not complete any check-ins yesterday. This is unusual for her typical pattern.',
    0,
    NULL,
    ARRAY['Missed all check-ins', 'No contact all day']
  ),

  -- 2 days ago
  (
    '33333333-3333-3333-3333-333333333333',
    CURRENT_DATE - INTERVAL '2 days',
    1,
    5,
    'neutral',
    0.45,
    true,
    1,
    false,
    'fair',
    'ok',
    'Dottie had a quiet but normal day. Reported feeling tired but maintained medication schedule.',
    0,
    NULL,
    NULL
  );

-- =====================================================
-- 5. CREATE ALERTS
-- =====================================================

-- Active alert for Dorothy's dizziness
INSERT INTO public.alerts (patient_id, check_in_id, alert_type, severity, alert_message, alert_details, status, notified_caregivers, notification_sent_at, created_at)
VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    (SELECT id FROM public.check_ins WHERE patient_id = '33333333-3333-3333-3333-333333333333' ORDER BY started_at DESC LIMIT 1),
    'health_concern',
    'high',
    'Dorothy reported feeling dizzy when standing up',
    '{"symptoms": ["dizziness", "lightheadedness"], "action_taken": "Advised to sit down and drink water", "fall_risk": true}'::jsonb,
    'active',
    ARRAY['cccccccc-cccc-cccc-cccc-cccccccccccc'],
    NOW() - INTERVAL '11 hours 50 minutes',
    NOW() - INTERVAL '11 hours 50 minutes'
  );

-- Resolved alert for Robert's missed check-in (from yesterday)
INSERT INTO public.alerts (patient_id, alert_type, severity, alert_message, alert_details, status, notified_caregivers, notification_sent_at, acknowledged_by, acknowledged_at, resolution_notes, created_at)
VALUES
  (
    '22222222-2222-2222-2222-222222222222',
    'missed_checkin',
    'medium',
    'Robert missed his evening check-in',
    '{"scheduled_time": "20:00", "missed_duration_hours": 2}'::jsonb,
    'resolved',
    ARRAY['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'],
    NOW() - INTERVAL '1 day 2 hours',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    NOW() - INTERVAL '1 day 1 hour',
    'Called Bob - he was watching TV and forgot to check in. All is well.',
    NOW() - INTERVAL '1 day 2 hours'
  );

-- =====================================================
-- 6. CREATE CAREGIVER NOTES
-- =====================================================

INSERT INTO public.caregiver_notes (patient_id, caregiver_id, note_type, note_text, is_reminder, reminder_date, shared_with_patient)
VALUES
  -- Susan's note about Margaret's doctor appointment
  (
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'appointment',
    'Dr. Chen - Annual checkup scheduled for next Tuesday at 10:00 AM. Need to bring medication list.',
    true,
    CURRENT_DATE + INTERVAL '6 days',
    true
  ),

  -- Emily's concern about Robert
  (
    '22222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'concern',
    'Dad seems to be sleeping poorly and has lower energy lately. Should mention this to his doctor at next visit. Consider scheduling an earlier appointment if pattern continues.',
    false,
    NULL,
    false
  ),

  -- Michael's urgent note about Dorothy
  (
    '33333333-3333-3333-3333-333333333333',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'concern',
    'Mom reported dizziness this morning. I called her and she says she feels better now after sitting and drinking water. Will visit her this afternoon to check in person. May need to schedule doctor appointment if dizziness continues.',
    false,
    NULL,
    false
  ),

  -- Susan's general note
  (
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'general',
    'Mom is doing great! Very happy with her progress and social engagement. She mentioned wanting to join a book club at the senior center.',
    false,
    NULL,
    true
  );

-- =====================================================
-- 7. CREATE ACTIVITY LOG ENTRIES
-- =====================================================

INSERT INTO public.activity_log (user_id, activity_type, activity_description, activity_metadata)
VALUES
  -- Margaret's recent login
  (
    '11111111-1111-1111-1111-111111111111',
    'login',
    'User logged in via mobile app',
    '{"device": "iPhone 13", "os": "iOS 17.2"}'::jsonb
  ),

  -- Susan viewing Margaret's dashboard
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'check_in',
    'Caregiver viewed patient dashboard',
    '{"patient_id": "11111111-1111-1111-1111-111111111111", "view_duration_seconds": 145}'::jsonb
  ),

  -- Alert sent for Dorothy
  (
    '33333333-3333-3333-3333-333333333333',
    'alert_sent',
    'Health concern alert sent to caregiver',
    '{"alert_type": "health_concern", "severity": "high", "caregiver_id": "cccccccc-cccc-cccc-cccc-cccccccccccc"}'::jsonb
  ),

  -- Michael acknowledged Dorothy's alert
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'alert_acknowledged',
    'Caregiver acknowledged alert and took action',
    '{"alert_id": "placeholder", "action_taken": "Called patient"}'::jsonb
  );

-- =====================================================
-- VERIFICATION QUERIES (run these to check data)
-- =====================================================

-- Uncomment to verify data was inserted:

-- SELECT COUNT(*) as profile_count FROM public.profiles;
-- SELECT COUNT(*) as relationship_count FROM public.care_relationships;
-- SELECT COUNT(*) as checkin_count FROM public.check_ins;
-- SELECT COUNT(*) as summary_count FROM public.daily_summaries;
-- SELECT COUNT(*) as alert_count FROM public.alerts;
-- SELECT COUNT(*) as note_count FROM public.caregiver_notes;

-- View patient status overview:
-- SELECT
--   p.full_name,
--   p.role,
--   ds.summary_date,
--   ds.overall_status,
--   ds.overall_mood,
--   ds.check_in_count
-- FROM public.profiles p
-- LEFT JOIN public.daily_summaries ds ON ds.patient_id = p.id AND ds.summary_date = CURRENT_DATE
-- WHERE p.role = 'senior'
-- ORDER BY p.full_name;
