# Parra Connect - Database Setup Guide

## Overview

This guide will walk you through setting up your complete Supabase database with schema and mock data for testing.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Migration Files](#migration-files)
3. [Step-by-Step Setup Instructions](#step-by-step-setup-instructions)
4. [Database Schema Overview](#database-schema-overview)
5. [Mock Data Details](#mock-data-details)
6. [Testing Queries](#testing-queries)
7. [Next Steps](#next-steps)

---

## Prerequisites

- Supabase project created (you already have this: `xoygyimwkmepwjqmnfxh`)
- Access to Supabase Dashboard SQL Editor
- Your environment variables configured in `.env`

---

## Migration Files

You have 3 migration files to run **in order**:

1. **`20251011000001_create_waitlist_signups.sql`** - Beta signup form table
2. **`20251011000002_create_core_schema.sql`** - All core application tables
3. **`20251011000003_seed_mock_data.sql`** - Realistic test data

---

## Step-by-Step Setup Instructions

### Method 1: Via Supabase Dashboard (Recommended)

#### Step 1: Navigate to SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `xoygyimwkmepwjqmnfxh`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

#### Step 2: Run Migration 1 - Waitlist Signups

1. Copy the entire contents of `supabase/migrations/20251011000001_create_waitlist_signups.sql`
2. Paste into the SQL Editor
3. Click **Run** (or press Cmd/Ctrl + Enter)
4. Verify: You should see "Success. No rows returned"

#### Step 3: Run Migration 2 - Core Schema

1. Create a **New Query** in SQL Editor
2. Copy the entire contents of `supabase/migrations/20251011000002_create_core_schema.sql`
3. Paste into the SQL Editor
4. Click **Run**
5. This will take a few seconds - wait for confirmation
6. Verify: You should see "Success" message

#### Step 4: Run Migration 3 - Mock Data

1. Create a **New Query** in SQL Editor
2. Copy the entire contents of `supabase/migrations/20251011000003_seed_mock_data.sql`
3. Paste into the SQL Editor
4. Click **Run**
5. Verify: You should see "Success" message

#### Step 5: Verify Data Loaded

Run this verification query in SQL Editor:

```sql
-- Check all tables have data
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM public.profiles
UNION ALL
SELECT 'care_relationships', COUNT(*) FROM public.care_relationships
UNION ALL
SELECT 'check_ins', COUNT(*) FROM public.check_ins
UNION ALL
SELECT 'daily_summaries', COUNT(*) FROM public.daily_summaries
UNION ALL
SELECT 'caregiver_notes', COUNT(*) FROM public.caregiver_notes
UNION ALL
SELECT 'alerts', COUNT(*) FROM public.alerts
UNION ALL
SELECT 'activity_log', COUNT(*) FROM public.activity_log
UNION ALL
SELECT 'waitlist_signups', COUNT(*) FROM public.waitlist_signups;
```

**Expected Results:**
- `profiles`: 6 rows (3 seniors, 3 caregivers)
- `care_relationships`: 3 rows
- `check_ins`: 8 rows
- `daily_summaries`: 7 rows
- `caregiver_notes`: 4 rows
- `alerts`: 2 rows
- `activity_log`: 4 rows
- `waitlist_signups`: 0 rows (will populate when users sign up via form)

---

### Method 2: Via Supabase CLI (Alternative)

If you have Supabase CLI installed and authenticated:

```bash
# From your project root
cd /workspace/para-kind-connect-local

# Link to your project
npx supabase link --project-ref xoygyimwkmepwjqmnfxh

# Push migrations
npx supabase db push
```

---

## Database Schema Overview

### Core Tables

#### 1. **profiles**
Extends Supabase auth.users with application-specific data.

**Fields:**
- `id` - UUID (matches auth.users.id)
- `email`, `full_name`, `display_name`
- `role` - 'senior' | 'caregiver' | 'family_member' | 'admin'
- `phone_number`, `date_of_birth`
- `emergency_contact_name`, `emergency_contact_phone`
- `notification_preferences` (JSONB)
- Timestamps

**Purpose:** Stores all user profile information

---

#### 2. **care_relationships**
Links patients with their caregivers.

**Fields:**
- `patient_id` - References profiles
- `caregiver_id` - References profiles
- `relationship_type` - 'primary_caregiver' | 'family_member' | etc.
- `relationship_label` - "Daughter", "Son", etc.
- Permission flags: `can_view_health_data`, `can_receive_alerts`, `can_modify_settings`
- `status` - 'active' | 'inactive' | 'pending'

**Purpose:** Manages who can access whose data

---

#### 3. **check_ins**
Stores conversation history and AI analysis.

**Fields:**
- `patient_id` - References profiles
- `interaction_type` - 'voice' | 'text' | 'whatsapp'
- `started_at`, `ended_at`, `duration_seconds`
- `messages` - JSONB array of conversation messages
- `sentiment_score` - Decimal (-1.0 to 1.0)
- `mood_detected` - 'happy' | 'neutral' | 'sad' | 'concerned' | etc.
- `topics_discussed` - Array of topics
- Safety flags: `safety_concern_detected`, `safety_concern_type`, `alert_sent`
- `commitments` - JSONB array of user commitments

**Purpose:** Complete conversation history with AI analysis

---

#### 4. **daily_summaries**
Aggregated daily wellness metrics.

**Fields:**
- `patient_id`, `summary_date`
- Activity: `check_in_count`, `total_conversation_minutes`
- Wellness: `overall_mood`, `average_sentiment_score`
- Compliance: `medication_taken`, `meals_reported`, `sleep_quality`
- Status: `overall_status` ('ok' | 'warning' | 'alert')
- `summary_text` - AI-generated summary
- `highlights`, `concerns` - Arrays of notable items
- Alert tracking: `alerts_triggered`, `alert_types`

**Purpose:** Daily rollup for caregiver dashboard

---

#### 5. **caregiver_notes**
Notes and reminders from caregivers.

**Fields:**
- `patient_id`, `caregiver_id`
- `note_type` - 'general' | 'medication' | 'appointment' | etc.
- `note_text`
- Reminder fields: `reminder_date`, `reminder_time`, `is_reminder`
- Sharing: `shared_with_patient`, `shared_with_care_team`

**Purpose:** Caregiver communication and task management

---

#### 6. **alerts**
Safety alerts and notifications.

**Fields:**
- `patient_id`, `check_in_id`
- `alert_type` - 'fall_detected' | 'distress_signal' | 'missed_checkin' | etc.
- `severity` - 'low' | 'medium' | 'high' | 'critical'
- `alert_message`, `alert_details` (JSONB)
- `status` - 'active' | 'acknowledged' | 'resolved' | 'false_alarm'
- Notification tracking: `notified_caregivers[]`, `acknowledged_by`, `acknowledged_at`
- Escalation: `escalation_countdown_started`, `escalated`

**Purpose:** Safety event tracking and escalation

---

#### 7. **activity_log**
Audit trail of user actions.

**Fields:**
- `user_id`
- `activity_type` - 'login' | 'check_in' | 'alert_sent' | etc.
- `activity_description`, `activity_metadata` (JSONB)
- `ip_address`, `user_agent`

**Purpose:** Security and analytics

---

#### 8. **waitlist_signups**
Beta signup form submissions.

**Fields:**
- `name`, `email` (unique), `role`, `message`
- Timestamps

**Purpose:** Beta waitlist management

---

## Mock Data Details

### Test Users Created

#### **Seniors/Patients:**

1. **Margaret Smith (Maggie)**
   - ID: `11111111-1111-1111-1111-111111111111`
   - Email: `margaret.smith@example.com`
   - Age: 78
   - Status: **OK** (green)
   - Characteristics: Happy, engaged, good medication adherence
   - Caregiver: Susan Miller (daughter)

2. **Robert Johnson (Bob)**
   - ID: `22222222-2222-2222-2222-222222222222`
   - Email: `robert.johnson@example.com`
   - Age: 82
   - Status: **WARNING** (yellow)
   - Characteristics: Poor sleep, reduced appetite, missed evening check-in
   - Caregiver: Emily Johnson (daughter)

3. **Dorothy Williams (Dottie)**
   - ID: `33333333-3333-3333-3333-333333333333`
   - Email: `dorothy.williams@example.com`
   - Age: 75
   - Status: **ALERT** (red/coral)
   - Characteristics: Reported dizziness, missed check-ins, health concern
   - Caregiver: Michael Williams (son)

#### **Caregivers:**

1. **Susan Miller**
   - ID: `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`
   - Email: `susan.miller@example.com`
   - Caring for: Margaret Smith

2. **Emily Johnson**
   - ID: `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb`
   - Email: `emily.johnson@example.com`
   - Caring for: Robert Johnson

3. **Michael Williams**
   - ID: `cccccccc-cccc-cccc-cccc-cccccccccccc`
   - Email: `michael.williams@example.com`
   - Caring for: Dorothy Williams

---

## Testing Queries

### View All Patients with Current Status

```sql
SELECT
  p.full_name,
  p.display_name,
  ds.summary_date,
  ds.overall_status,
  ds.overall_mood,
  ds.check_in_count,
  ds.summary_text
FROM public.profiles p
LEFT JOIN public.daily_summaries ds
  ON ds.patient_id = p.id
  AND ds.summary_date = CURRENT_DATE
WHERE p.role = 'senior'
ORDER BY
  CASE ds.overall_status
    WHEN 'alert' THEN 1
    WHEN 'warning' THEN 2
    WHEN 'ok' THEN 3
    ELSE 4
  END;
```

### View Active Alerts

```sql
SELECT
  p.full_name as patient_name,
  a.alert_type,
  a.severity,
  a.alert_message,
  a.status,
  a.created_at
FROM public.alerts a
JOIN public.profiles p ON p.id = a.patient_id
WHERE a.status = 'active'
ORDER BY a.severity DESC, a.created_at DESC;
```

### View Recent Check-ins with Mood

```sql
SELECT
  p.full_name as patient_name,
  c.started_at,
  c.interaction_type,
  c.mood_detected,
  c.sentiment_score,
  c.safety_concern_detected,
  c.topics_discussed
FROM public.check_ins c
JOIN public.profiles p ON p.id = c.patient_id
ORDER BY c.started_at DESC
LIMIT 10;
```

### View Caregiver-Patient Relationships

```sql
SELECT
  patient.full_name as patient,
  caregiver.full_name as caregiver,
  cr.relationship_type,
  cr.relationship_label,
  cr.status
FROM public.care_relationships cr
JOIN public.profiles patient ON patient.id = cr.patient_id
JOIN public.profiles caregiver ON caregiver.id = cr.caregiver_id
ORDER BY patient.full_name;
```

### View Weekly Summary for a Patient

```sql
SELECT
  summary_date,
  overall_status,
  overall_mood,
  check_in_count,
  medication_taken,
  sleep_quality,
  array_to_string(highlights, ', ') as highlights,
  array_to_string(concerns, ', ') as concerns
FROM public.daily_summaries
WHERE patient_id = '11111111-1111-1111-1111-111111111111'
  AND summary_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY summary_date DESC;
```

---

## Security Features Included

### Row Level Security (RLS)

All tables have RLS enabled with policies:

- **Profiles**: Users can view/edit their own profile
- **Care Relationships**: Visible to both patient and caregiver
- **Check-ins**: Patients see their own; caregivers see their patients' (if permitted)
- **Daily Summaries**: Same as check-ins
- **Alerts**: Patients see their own; caregivers with `can_receive_alerts` permission see patients' alerts
- **Caregiver Notes**: Caregivers manage their own; patients see notes shared with them
- **Activity Log**: Users see their own activity

### Automatic Triggers

- **Updated timestamps**: All tables auto-update `updated_at`
- **Check-in duration**: Auto-calculated when `ended_at` is set
- **Daily summary updates**: Automatically updated when check-ins complete

---

## Important Notes for Testing

### ⚠️ These are NOT real Supabase Auth users

The mock data creates profile records with placeholder UUIDs. In production:

1. Users sign up through Supabase Auth (creates `auth.users` record)
2. Your app creates matching `profiles` record automatically
3. The `profiles.id` must match `auth.users.id`

### For development testing without auth:

You can query directly by patient/caregiver IDs:
- Margaret: `11111111-1111-1111-1111-111111111111`
- Robert: `22222222-2222-2222-2222-222222222222`
- Dorothy: `33333333-3333-3333-3333-333333333333`

### RLS Policies will block direct queries

Since you're not authenticated as these users, you may need to temporarily disable RLS for testing:

```sql
-- ⚠️ ONLY FOR DEVELOPMENT - DO NOT USE IN PRODUCTION
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries DISABLE ROW LEVEL SECURITY;
-- ... etc for other tables
```

**OR** use the service role key (bypasses RLS) in your development environment.

---

## Next Steps

After running all migrations:

### 1. **Update Your Frontend Code**

The dashboards currently use mock data. You'll need to:

- Update `CaregiverDashboard.tsx` to fetch from Supabase
- Update `PatientDashboard.tsx` to fetch from Supabase
- Update `HistoryView.tsx` to query `daily_summaries`
- Connect `SeniorChat.tsx` to save check-ins

### 2. **Implement Supabase Auth**

For user authentication:
- Create login/signup pages
- Use `supabase.auth.signUp()` and `supabase.auth.signIn()`
- Create profiles automatically on signup
- Protect routes with auth guards

### 3. **Connect Real-time Features**

Supabase supports real-time subscriptions:

```typescript
// Example: Listen for new alerts
supabase
  .channel('alerts')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'alerts',
    filter: `patient_id=eq.${patientId}`
  }, (payload) => {
    console.log('New alert!', payload);
  })
  .subscribe();
```

### 4. **Test the Beta Signup Form**

The waitlist signup form is now fully integrated. Test it:
1. Go to your deployed site (or localhost)
2. Click "Try Free Beta" button
3. Fill out the form
4. Check Supabase table editor for new row in `waitlist_signups`

### 5. **Update WhatsApp Phone Number**

Replace placeholder `15555555555` in:
- `src/components/Hero.tsx` (line 37)
- `src/components/CTASection.tsx` (line 30)

---

## Troubleshooting

### Error: "relation does not exist"

**Cause:** Migrations not run in order or not completed

**Fix:** Run migrations 1, 2, 3 sequentially

### Error: "duplicate key value violates unique constraint"

**Cause:** Trying to run seed data twice

**Fix:**
```sql
-- Clear all data and re-run seed
TRUNCATE public.profiles CASCADE;
-- Then re-run migration 3
```

### Can't see data in queries

**Cause:** RLS blocking your queries

**Fix:** Use service role key or temporarily disable RLS (see above)

### Check-ins not showing in daily_summaries

**Cause:** Trigger may not have fired

**Fix:** Manually update summary:
```sql
-- Force summary update
UPDATE public.check_ins
SET updated_at = NOW()
WHERE ended_at IS NOT NULL;
```

---

## Database Diagram (Relationships)

```
auth.users (Supabase)
    ↓ (1:1)
profiles
    ↓ (1:many)
    ├── check_ins
    ├── daily_summaries
    ├── alerts
    ├── caregiver_notes (as patient or caregiver)
    └── activity_log

care_relationships
    ├── patient_id → profiles
    └── caregiver_id → profiles

check_ins
    ├── patient_id → profiles
    └── triggers → daily_summaries update

alerts
    ├── patient_id → profiles
    └── check_in_id → check_ins
```

---

## Support

If you encounter issues:

1. Check Supabase logs (Dashboard → Database → Logs)
2. Verify RLS policies aren't blocking queries
3. Ensure all 3 migrations ran successfully
4. Check for typos in UUIDs when testing queries

---

## Summary Checklist

- [ ] Run migration 1: `create_waitlist_signups.sql`
- [ ] Run migration 2: `create_core_schema.sql`
- [ ] Run migration 3: `seed_mock_data.sql`
- [ ] Verify data with test queries
- [ ] Test beta signup form
- [ ] Update WhatsApp phone numbers
- [ ] (Later) Connect frontend to Supabase
- [ ] (Later) Implement authentication

**Your database is now ready for development and testing!** 🎉
