# RLS Policies - Quick Reference Card

**Para Connect Database Security**

---

## Quick Status Check

```sql
-- Are all tables protected?
SELECT tablename, relrowsecurity as rls_enabled
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public';

-- How many policies do we have?
SELECT COUNT(*) as total_policies FROM pg_policies WHERE schemaname = 'public';
-- Expected: 32 policies

-- Test if I can access my data
SELECT * FROM profiles WHERE id = auth.uid();
```

---

## Access Rules Summary

### Profiles
- ✓ View: Own profile OR admin
- ✓ Create: Own profile only
- ✓ Update: Own profile (cannot change role) OR admin
- ✓ Delete: Admin only

### Care Relationships
- ✓ View: If you're patient or caregiver OR admin
- ✓ Create: Patient can invite OR admin
- ✓ Update: Patient modifies permissions, caregiver accepts OR admin
- ✓ Delete: Patient only OR admin

### Check-Ins (PHI)
- ✓ View: Patient OR authorized caregiver (can_view_health_data) OR admin
- ✓ Create: Patient only OR admin
- ✓ Update: Patient only OR admin
- ✗ Caregivers: Read-only access

### Daily Summaries (PHI)
- ✓ View: Patient OR active caregiver OR admin
- ✓ Create/Update/Delete: Admin only (system-generated)

### Alerts (PHI)
- ✓ View: Patient OR authorized caregiver (can_receive_alerts) OR admin
- ✓ Update: Authorized caregiver OR admin
- ✗ Patient: Can view but NOT update (safety)
- ✓ Create/Delete: Admin only

### Caregiver Notes (PHI)
- ✓ View: Note creator OR patient (if shared) OR care team (if shared) OR admin
- ✓ Create: Caregiver with active relationship
- ✓ Update/Delete: Note creator OR admin

### Activity Log
- ✓ View: Own activity OR admin views all
- ✓ Create: User can log own activity
- ✓ Update/Delete: Admin only

### Waitlist Signups
- ✓ View: Admin only
- ✓ Create: Anyone (including anonymous)
- ✓ Update/Delete: Admin only

---

## Helper Functions

```sql
-- Is user an admin?
SELECT public.is_admin('user-uuid');

-- Does caregiver have active relationship with patient?
SELECT public.has_active_care_relationship('caregiver-uuid', 'patient-uuid');

-- Can caregiver view patient's health data?
SELECT public.can_view_patient_health_data('caregiver-uuid', 'patient-uuid');

-- Can caregiver receive patient's alerts?
SELECT public.can_receive_patient_alerts('caregiver-uuid', 'patient-uuid');

-- Can caregiver modify patient settings?
SELECT public.can_modify_patient_settings('caregiver-uuid', 'patient-uuid');
```

---

## Common Tasks

### Grant Caregiver Full Access
```sql
UPDATE care_relationships
SET
  can_view_health_data = true,
  can_receive_alerts = true,
  can_modify_settings = true,
  status = 'active'
WHERE patient_id = 'patient-uuid'
  AND caregiver_id = 'caregiver-uuid';
```

### Revoke Caregiver Access
```sql
-- Soft removal (keep relationship record)
UPDATE care_relationships
SET status = 'inactive'
WHERE patient_id = 'patient-uuid' AND caregiver_id = 'caregiver-uuid';

-- Hard removal (delete relationship)
DELETE FROM care_relationships
WHERE patient_id = 'patient-uuid' AND caregiver_id = 'caregiver-uuid';
```

### Make User an Admin
```sql
-- Only existing admins or service role can do this
UPDATE profiles
SET role = 'admin'
WHERE id = 'user-uuid';
```

### Check User's Permissions
```sql
-- What patients can this caregiver see?
SELECT
  p.full_name as patient_name,
  cr.status,
  cr.can_view_health_data,
  cr.can_receive_alerts,
  cr.can_modify_settings
FROM care_relationships cr
JOIN profiles p ON p.id = cr.patient_id
WHERE cr.caregiver_id = 'caregiver-uuid';

-- What caregivers does this patient have?
SELECT
  p.full_name as caregiver_name,
  cr.relationship_type,
  cr.status,
  cr.can_view_health_data,
  cr.can_receive_alerts
FROM care_relationships cr
JOIN profiles p ON p.id = cr.caregiver_id
WHERE cr.patient_id = 'patient-uuid';
```

---

## Troubleshooting

### Can't see any data?
```sql
-- 1. Are you authenticated?
SELECT auth.uid(); -- Should return your UUID

-- 2. Do you have a profile?
SELECT * FROM profiles WHERE id = auth.uid();

-- 3. Is RLS enabled?
SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles';
```

### Caregiver can't see patient data?
```sql
-- Check relationship status
SELECT * FROM care_relationships
WHERE caregiver_id = auth.uid() AND patient_id = 'patient-uuid';

-- Check if relationship is active
SELECT status, can_view_health_data, can_receive_alerts
FROM care_relationships
WHERE caregiver_id = auth.uid() AND patient_id = 'patient-uuid';

-- Test helper function
SELECT public.can_view_patient_health_data(auth.uid(), 'patient-uuid');
```

### "Row violates row-level security policy" error?
- You're trying to insert/update a row you don't have permission for
- Check you're using your own user_id for personal data
- Check care relationship exists and is active
- Verify permission flags are true

---

## Emergency Procedures

### Temporarily Disable RLS (EMERGENCY ONLY)
```sql
-- ⚠️ WARNING: Removes all access control!
ALTER TABLE public.table_name DISABLE ROW LEVEL SECURITY;

-- Document this immediately
INSERT INTO activity_log (user_id, activity_type, activity_description)
VALUES (auth.uid(), 'security_event', 'RLS disabled on table_name - EMERGENCY');

-- RE-ENABLE ASAP
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;
```

### View All Policies
```sql
SELECT
  tablename,
  policyname,
  cmd as operation,
  permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

### Verify Deployment
```sql
-- Check all tables have RLS
SELECT
  tablename,
  CASE WHEN relrowsecurity THEN '✓' ELSE '✗ MISSING' END as rls
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'care_relationships', 'check_ins',
                    'daily_summaries', 'alerts', 'caregiver_notes',
                    'activity_log', 'waitlist_signups');

-- Check policy count
SELECT tablename, COUNT(*) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;
```

---

## PHI Access Matrix

| Table | Patient | Caregiver (Active) | Caregiver (Needs Permission) | Admin |
|-------|---------|-------------------|------------------------------|-------|
| **profiles** | Own only | Own only | Own only | All |
| **care_relationships** | Own | Own | Own | All |
| **check_ins** | Own | ✓ | can_view_health_data=true | All |
| **daily_summaries** | Own | ✓ | Active relationship | All |
| **alerts** | View only | ✓ | can_receive_alerts=true | All |
| **caregiver_notes** | If shared | Own + shared | Own + shared | All |
| **activity_log** | Own | Own | Own | All |
| **waitlist_signups** | - | - | - | All |

---

## Performance Tips

```sql
-- Check if RLS indexes exist
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%role%' OR indexname LIKE '%caregiver%';

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM check_ins WHERE patient_id = 'patient-uuid';

-- Update table statistics
ANALYZE profiles;
ANALYZE care_relationships;
ANALYZE check_ins;
```

---

## Testing Queries

```sql
-- Test 1: Can I see my profile?
SELECT * FROM profiles WHERE id = auth.uid();
-- Expected: 1 row

-- Test 2: Can I see other profiles?
SELECT * FROM profiles WHERE id != auth.uid();
-- Expected: 0 rows (unless admin)

-- Test 3: Can caregiver see patient check-ins?
SELECT * FROM check_ins WHERE patient_id = 'patient-uuid';
-- Expected: Rows if authorized, empty if not

-- Test 4: Can patient dismiss their own alert?
UPDATE alerts SET status = 'resolved' WHERE patient_id = auth.uid();
-- Expected: Should fail (patients can't dismiss own alerts)

-- Test 5: Can caregiver acknowledge alert?
UPDATE alerts
SET status = 'acknowledged', acknowledged_by = auth.uid()
WHERE patient_id = 'patient-uuid';
-- Expected: Should succeed if can_receive_alerts=true
```

---

## Key Policies to Remember

1. **Patients control their data**: Can view/modify own data and invite caregivers
2. **Caregivers need permission**: Access based on active relationships and permission flags
3. **Admins have oversight**: Full access for system management
4. **Safety first**: Patients can't dismiss their own critical alerts
5. **Audit everything**: Activity log tracks PHI access
6. **Minimum necessary**: Users only see what they need

---

## HIPAA Compliance Notes

- ✓ **Access Control**: Unique user identification via Supabase Auth
- ✓ **Minimum Necessary**: RLS enforces need-to-know access
- ✓ **Audit Trail**: activity_log table + Supabase logs
- ✓ **Data Integrity**: Policies prevent unauthorized modification
- ✓ **Emergency Access**: Admin role for break-the-glass scenarios
- ✓ **Access Revocation**: Deactivating relationship immediately revokes access

---

## Files Reference

- **Full Documentation**: `RLS_POLICIES_DOCUMENTATION.md` (100+ pages)
- **Deployment Guide**: `RLS_DEPLOYMENT_GUIDE.md`
- **Migration File**: `20251012000001_comprehensive_rls_policies.sql`
- **Test Suite**: `20251012000002_rls_policy_tests.sql`
- **This Document**: `RLS_QUICK_REFERENCE.md`

---

## Contact

- **Development**: development@paraconnect.com
- **Security**: security@paraconnect.com
- **Emergency**: emergency-access@paraconnect.com

---

**Last Updated**: 2025-10-12
**Version**: 1.0

---

## Quick Copy-Paste Commands

### Enable RLS on all tables
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;
```

### Disable RLS (emergency only)
```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_relationships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_signups DISABLE ROW LEVEL SECURITY;
```

### View all your data
```sql
SELECT 'profile' as type, id::text FROM profiles WHERE id = auth.uid()
UNION ALL
SELECT 'check_in', id::text FROM check_ins WHERE patient_id = auth.uid()
UNION ALL
SELECT 'summary', id::text FROM daily_summaries WHERE patient_id = auth.uid()
UNION ALL
SELECT 'alert', id::text FROM alerts WHERE patient_id = auth.uid()
UNION ALL
SELECT 'note', id::text FROM caregiver_notes WHERE patient_id = auth.uid() AND shared_with_patient = true
UNION ALL
SELECT 'care_rel', id::text FROM care_relationships WHERE patient_id = auth.uid() OR caregiver_id = auth.uid()
UNION ALL
SELECT 'activity', id::text FROM activity_log WHERE user_id = auth.uid();
```

---

**Print this document and keep it handy for quick reference!**
