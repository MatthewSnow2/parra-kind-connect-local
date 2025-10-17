# Sample Data Migration Guide

This guide explains how to run the sample data migrations in the correct order to populate your database with realistic test data for three seniors.

## Overview

The sample data has been split into **4 separate migration files** to make debugging easier and allow you to run them incrementally:

1. **Fix mood constraint** - Allows 'anxious' and 'confused' moods
2. **Dorothy Williams** - Healthy senior (low risk)
3. **Margaret Smith** - Medium risk senior
4. **Robert Johnson** - High risk senior with multiple health concerns

## Migration Files

| File | Description | Status |
|------|-------------|--------|
| `20251016000003_fix_mood_constraint.sql` | **MUST RUN FIRST** - Fixes check constraint | Required |
| `20251016000004_sample_data_dorothy.sql` | Dorothy Williams sample data | Optional |
| `20251016000005_sample_data_margaret.sql` | Margaret Smith sample data | Optional |
| `20251016000006_sample_data_robert.sql` | Robert Johnson sample data | Optional |

## How to Run

### Option 1: Run All Migrations (Recommended)

Run these in your Supabase SQL Editor in this **exact order**:

```sql
-- Step 1: Fix mood constraint (REQUIRED)
-- Copy and paste contents of: 20251016000003_fix_mood_constraint.sql

-- Step 2: Add Dorothy Williams (healthy senior)
-- Copy and paste contents of: 20251016000004_sample_data_dorothy.sql

-- Step 3: Add Margaret Smith (medium risk)
-- Copy and paste contents of: 20251016000005_sample_data_margaret.sql

-- Step 4: Add Robert Johnson (high risk)
-- Copy and paste contents of: 20251016000006_sample_data_robert.sql
```

### Option 2: Run Individual Seniors

If you only want specific seniors, you can run:

```sql
-- Always run this first:
-- 20251016000003_fix_mood_constraint.sql

-- Then run any of these (in any order):
-- 20251016000004_sample_data_dorothy.sql
-- 20251016000005_sample_data_margaret.sql
-- 20251016000006_sample_data_robert.sql
```

### Option 3: Re-run Individual Migrations

All migrations are **idempotent** - they can be run multiple times without errors. To refresh a senior's data:

1. Open the specific file (e.g., `20251016000004_sample_data_dorothy.sql`)
2. Run it again in Supabase SQL Editor
3. It will DELETE the old data and INSERT fresh data

## What Each Migration Does

### 1. Fix Mood Constraint (`20251016000003_fix_mood_constraint.sql`)

**Purpose:** Fixes the `daily_summaries` table to accept 'anxious' and 'confused' moods.

**Why needed:** The trigger that auto-creates daily summaries was failing because it tried to use moods not allowed by the check constraint.

**Changes:**
- Drops old constraint
- Adds new constraint with: `'happy', 'neutral', 'sad', 'concerned', 'anxious', 'confused', 'mixed'`

**Run time:** < 1 second

---

### 2. Dorothy Williams (`20251016000004_sample_data_dorothy.sql`)

**Profile:** Healthy senior with excellent metrics (ok status)

**Data created:**
- ✅ 7 check-ins (happy mood, positive interactions)
- ✅ 5 daily summaries (all "ok" status)
- ✅ 3 caregiver notes (routine observations)
- ✅ 2 activity log entries
- ✅ 0 alerts (no safety concerns)

**Run time:** ~2-3 seconds

**Sample scenarios:**
- Tai chi class participation
- Grandson visit to park
- Phone call with daughter
- Gardening activity

---

### 3. Margaret Smith (`20251016000005_sample_data_margaret.sql`)

**Profile:** Medium risk with pain and medication issues (warning status)

**Data created:**
- ✅ 6 check-ins (mixed moods, some concerns)
- ✅ 5 daily summaries (warning/ok status)
- ✅ 4 caregiver notes (concerns about medication)
- ✅ 3 activity log entries
- ✅ 2 alerts (medication missed, health concern)

**Run time:** ~3-4 seconds

**Sample scenarios:**
- Forgot morning medication (reminded)
- Knee pain affecting sleep
- Doctor appointment anxiety
- Post-appointment relief

---

### 4. Robert Johnson (`20251016000006_sample_data_robert.sql`)

**Profile:** High risk with multiple health concerns (alert status)

**Data created:**
- ✅ 5 check-ins (concerning interactions)
- ✅ 5 daily summaries (alert/warning status)
- ✅ 7 caregiver notes (serious concerns, urgent appointment)
- ✅ 5 activity log entries
- ✅ 5 alerts (fall, confusion, inactivity, depression)

**Run time:** ~4-5 seconds

**Sample scenarios:**
- Missed morning check-in, severe fatigue
- Confusion about medication
- Bathroom fall with bruised hip
- Depression symptoms
- Family visit helping mood

---

## Verification Queries

After running the migrations, verify the data was created:

```sql
-- Check all three seniors
SELECT
  p.full_name,
  (SELECT COUNT(*) FROM public.check_ins WHERE patient_id = p.id) as check_ins,
  (SELECT COUNT(*) FROM public.daily_summaries WHERE patient_id = p.id) as summaries,
  (SELECT COUNT(*) FROM public.alerts WHERE patient_id = p.id) as alerts,
  (SELECT COUNT(*) FROM public.caregiver_notes WHERE patient_id = p.id) as notes
FROM public.profiles p
WHERE p.id IN (
  '33333333-3333-3333-3333-333333333333',  -- Dorothy
  '11111111-1111-1111-1111-111111111111',  -- Margaret
  '22222222-2222-2222-2222-222222222222'   -- Robert
)
ORDER BY p.full_name;

-- Expected output:
-- Dorothy Williams   | 7 check_ins | 5 summaries | 0 alerts | 3 notes
-- Margaret Smith     | 6 check_ins | 5 summaries | 2 alerts | 4 notes
-- Robert Johnson     | 5 check_ins | 5 summaries | 5 alerts | 7 notes
```

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
**Solution:** The migration is idempotent. Just run it again - it will DELETE old data first.

### Error: "new row violates check constraint on mood"
**Solution:** Run `20251016000003_fix_mood_constraint.sql` first.

### Error: "VALUES lists must all be the same length"
**Solution:** This should be fixed. If you still see it, check that you're using the correct file versions.

### No data showing in dashboards
**Solution:** Check that:
1. You ran all migrations in order
2. The verification query above shows the expected counts
3. The frontend is pointing to the correct database

### Want to start over
**Solution:** Run each individual migration again - they DELETE old data and INSERT fresh data.

## Notes

- **All migrations are IDEMPOTENT** - safe to run multiple times
- **No database reset needed** - migrations clean up their own data
- **Order matters** - Always run the mood constraint fix first
- **Individual seniors** - Can run any subset after the constraint fix
- **Realistic data** - All timestamps are relative to NOW() so data stays fresh

## What's Next?

After running the migrations:

1. **View in dashboards:**
   - Admin dashboard: See all three seniors
   - Caregiver dashboards: Each caregiver sees their assigned senior

2. **Test features:**
   - Alert notifications
   - Daily summaries
   - Caregiver notes
   - Activity tracking
   - WhatsApp sharing buttons

3. **Customize:**
   - Edit the migration files to change data
   - Add more check-ins
   - Modify mood/status values
   - Create additional scenarios

## Clean Up

To remove all sample data:

```sql
-- Remove all three seniors' data
DELETE FROM public.activity_log WHERE user_id IN (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
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
```

## Support

If you encounter issues not covered here:
1. Check the Supabase SQL Editor for specific error messages
2. Verify you're running migrations in the correct order
3. Check that the patient IDs match your database

---

**Happy testing!** 🎉
