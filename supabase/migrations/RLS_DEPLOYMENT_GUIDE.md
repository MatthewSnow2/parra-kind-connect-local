# RLS Policies - Deployment Guide

## Overview

This guide walks you through deploying Row-Level Security (RLS) policies to the Para Connect Supabase database.

**CRITICAL**: These policies protect Protected Health Information (PHI) and are required for HIPAA compliance.

---

## Pre-Deployment Checklist

### Environment Verification

- [ ] Deploying to correct environment (test/staging/production)
- [ ] Database backup completed and verified
- [ ] Maintenance window scheduled (if production)
- [ ] Team notified of deployment
- [ ] Rollback plan prepared

### Access Verification

- [ ] Supabase project access confirmed
- [ ] Database admin credentials available
- [ ] Service role key available (for testing)
- [ ] Emergency contact information documented

### Testing Verification

- [ ] All tests passing in test environment
- [ ] No existing RLS policy conflicts
- [ ] Application code compatible with RLS
- [ ] Performance benchmarks acceptable

---

## Deployment Steps

### Step 1: Backup Database

**CRITICAL**: Always backup before modifying security policies.

```bash
# Using Supabase CLI
supabase db dump -f backup_before_rls_$(date +%Y%m%d_%H%M%S).sql

# Or using pg_dump directly
pg_dump postgresql://[CONNECTION_STRING] > backup_before_rls_$(date +%Y%m%d_%H%M%S).sql
```

**Verify backup**:
```bash
# Check backup file exists and has content
ls -lh backup_before_rls_*.sql
```

---

### Step 2: Review Migration Files

Files to deploy in order:

1. `20251012000001_comprehensive_rls_policies.sql` - Main RLS policies
2. `20251012000002_rls_policy_tests.sql` - Testing suite (optional in prod)

**Review checklist**:
- [ ] SQL syntax is valid
- [ ] All helper functions are included
- [ ] All 8 tables have policies
- [ ] No hardcoded user IDs or test data
- [ ] Comments and documentation present

---

### Step 3: Deploy to Test Environment

#### Option A: Using Supabase Dashboard

1. Navigate to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Open **New Query**
5. Copy contents of `20251012000001_comprehensive_rls_policies.sql`
6. Click **Run** (or Cmd/Ctrl + Enter)
7. Verify success messages

#### Option B: Using Supabase CLI

```bash
# Make sure you're in the project directory
cd /workspace/para-kind-connect-local

# Link to your Supabase project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push

# Or apply specific migration
supabase migration up --version 20251012000001
```

#### Option C: Using psql

```bash
# Connect to database
psql postgresql://[CONNECTION_STRING]

# Run migration
\i /workspace/para-kind-connect-local/supabase/migrations/20251012000001_comprehensive_rls_policies.sql

# Check for errors
\q
```

---

### Step 4: Verify Deployment

Run these verification queries immediately after deployment:

```sql
-- 1. Verify RLS is enabled on all tables
SELECT
  tablename,
  CASE WHEN relrowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED' END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'care_relationships', 'check_ins',
                    'daily_summaries', 'alerts', 'caregiver_notes',
                    'activity_log', 'waitlist_signups')
ORDER BY tablename;

-- Expected: All tables show '✓ ENABLED'

-- 2. Count policies per table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Expected: Each table has 4 policies (32 total)

-- 3. Verify helper functions exist
SELECT proname, prokind
FROM pg_proc
WHERE proname IN (
  'is_admin',
  'has_active_care_relationship',
  'can_view_patient_health_data',
  'can_receive_patient_alerts',
  'can_modify_patient_settings'
);

-- Expected: 5 functions returned

-- 4. Test basic policy (replace with actual user ID)
SET LOCAL request.jwt.claims = '{"sub": "YOUR_USER_ID"}';
SELECT * FROM profiles WHERE id = 'YOUR_USER_ID';

-- Expected: Returns 1 row (user's profile)

-- 5. Test unauthorized access
SELECT * FROM profiles WHERE id != 'YOUR_USER_ID';

-- Expected: Returns 0 rows (cannot see other profiles)
```

**Verification Checklist**:
- [ ] All 8 tables have RLS enabled
- [ ] 32 total policies created (4 per table)
- [ ] 5 helper functions exist
- [ ] Basic SELECT works for own data
- [ ] Cannot SELECT other users' data
- [ ] No error messages in logs

---

### Step 5: Run Test Suite (Recommended)

Deploy and run the test suite:

```sql
-- Run test file
\i /workspace/para-kind-connect-local/supabase/migrations/20251012000002_rls_policy_tests.sql

-- Review output for any failures
-- Manual testing scenarios should be performed by QA team
```

**Test Results Review**:
- [ ] All automated tests pass
- [ ] Manual test scenarios documented
- [ ] Performance benchmarks acceptable
- [ ] No unexpected errors in logs

---

### Step 6: Application Integration Testing

Test application with RLS enabled:

1. **User Registration/Login**:
   ```javascript
   // Should work: New user signup creates profile
   const { data, error } = await supabase.auth.signUp({
     email: 'test@example.com',
     password: 'securepass123'
   });
   // Verify: Profile created in profiles table
   ```

2. **Profile Access**:
   ```javascript
   // Should work: User views own profile
   const { data } = await supabase
     .from('profiles')
     .select('*')
     .eq('id', user.id)
     .single();

   // Should fail: User tries to view another profile
   const { data, error } = await supabase
     .from('profiles')
     .select('*')
     .neq('id', user.id);
   // Expect: Empty result, no error (RLS filters rows)
   ```

3. **Care Relationship Flow**:
   ```javascript
   // Patient creates relationship
   const { data, error } = await supabase
     .from('care_relationships')
     .insert({
       patient_id: patientId,
       caregiver_id: caregiverId,
       relationship_type: 'primary_caregiver',
       can_view_health_data: true,
       can_receive_alerts: true
     });
   // Verify: Relationship created

   // Caregiver accepts
   const { data, error } = await supabase
     .from('care_relationships')
     .update({ status: 'active', accepted_at: new Date().toISOString() })
     .eq('caregiver_id', caregiverId)
     .eq('patient_id', patientId);
   // Verify: Status updated

   // Caregiver can now view patient data
   const { data } = await supabase
     .from('check_ins')
     .select('*')
     .eq('patient_id', patientId);
   // Verify: Check-ins visible to caregiver
   ```

4. **Data Isolation**:
   ```javascript
   // Unrelated user cannot see patient data
   const { data } = await supabase
     .from('check_ins')
     .select('*')
     .eq('patient_id', patientId);
   // Verify: Empty result (no access)
   ```

**Application Testing Checklist**:
- [ ] User registration works
- [ ] User can view own profile
- [ ] User cannot view others' profiles
- [ ] Care relationships can be created
- [ ] Caregivers can accept invitations
- [ ] Authorized caregivers can view patient data
- [ ] Unauthorized users cannot view patient data
- [ ] Alerts are created and visible to authorized users
- [ ] Caregiver notes work with sharing flags
- [ ] Admin dashboard functions properly
- [ ] Error handling works for RLS violations

---

### Step 7: Performance Testing

Monitor query performance with RLS:

```sql
-- Enable timing
\timing on

-- Test common queries
EXPLAIN ANALYZE
SELECT * FROM check_ins WHERE patient_id = 'YOUR_USER_ID';

EXPLAIN ANALYZE
SELECT * FROM daily_summaries WHERE patient_id = 'YOUR_USER_ID';

EXPLAIN ANALYZE
SELECT * FROM alerts WHERE patient_id = 'YOUR_USER_ID';

-- Check slow query log
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%check_ins%' OR query LIKE '%daily_summaries%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Performance Checklist**:
- [ ] Query times within acceptable limits (<100ms for simple queries)
- [ ] Indexes are being used (check EXPLAIN plans)
- [ ] No full table scans on large tables
- [ ] Connection pool not exhausted
- [ ] No timeout errors

---

### Step 8: Deploy to Production

**Prerequisites**:
- [ ] All tests passing in test/staging
- [ ] Application team ready
- [ ] Maintenance window active (if applicable)
- [ ] Backup verified
- [ ] Rollback plan ready

**Production Deployment**:

```bash
# 1. Backup production database
supabase db dump -f backup_prod_before_rls_$(date +%Y%m%d_%H%M%S).sql

# 2. Deploy migration
supabase db push

# 3. Immediately verify
# Run verification queries from Step 4

# 4. Monitor for errors
# Check Supabase logs, application logs, error tracking
```

**Post-Deployment Monitoring** (First 24 hours):
- [ ] Monitor error logs every hour
- [ ] Check application error tracking (Sentry, etc.)
- [ ] Monitor query performance
- [ ] Verify user reports/support tickets
- [ ] Check audit logs for unusual activity

---

## Rollback Procedure

If issues are encountered:

### Quick Rollback (Disable RLS)

**⚠️ WARNING: This removes all access control. Use only in emergency.**

```sql
-- Disable RLS on all tables (emergency only)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_relationships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_signups DISABLE ROW LEVEL SECURITY;

-- Document this action immediately
INSERT INTO activity_log (user_id, activity_type, activity_description)
VALUES (auth.uid(), 'security_event', 'RLS temporarily disabled - emergency rollback');
```

### Complete Rollback (Remove Policies)

```sql
-- Drop all policies (see rollback section in RLS_POLICIES_DOCUMENTATION.md)

-- Drop policies for each table
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('profiles', 'care_relationships', 'check_ins',
                        'daily_summaries', 'alerts', 'caregiver_notes',
                        'activity_log', 'waitlist_signups')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                   pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- Drop helper functions
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.has_active_care_relationship(UUID, UUID);
DROP FUNCTION IF EXISTS public.can_view_patient_health_data(UUID, UUID);
DROP FUNCTION IF EXISTS public.can_receive_patient_alerts(UUID, UUID);
DROP FUNCTION IF EXISTS public.can_modify_patient_settings(UUID, UUID);

-- Optionally disable RLS
-- (Not recommended - better to fix policies and redeploy)
```

### Database Restore (Last Resort)

```bash
# Restore from backup taken in Step 1
supabase db reset

# Or using psql
psql postgresql://[CONNECTION_STRING] < backup_before_rls_TIMESTAMP.sql
```

---

## Post-Deployment Tasks

### Immediate (Within 24 Hours)

- [ ] Send deployment summary to team
- [ ] Update documentation with any issues encountered
- [ ] Schedule post-deployment review meeting
- [ ] Document any rollbacks or emergency procedures used
- [ ] Update runbook with lessons learned

### Short-Term (Within 1 Week)

- [ ] Review all error logs and support tickets
- [ ] Optimize any slow queries identified
- [ ] Update application code if needed
- [ ] Complete security audit checklist
- [ ] Document in compliance records

### Long-Term (Ongoing)

- [ ] Monitor query performance trends
- [ ] Review RLS policies monthly
- [ ] Update policies as needed for new features
- [ ] Regular security audits
- [ ] HIPAA compliance reviews

---

## Troubleshooting Common Issues

### Issue: Users Can't Access Their Own Data

**Symptoms**:
- User gets empty result sets
- Application features not working

**Diagnosis**:
```sql
-- Check if user is authenticated
SELECT auth.uid(); -- Should return user's UUID, not NULL

-- Check if user has profile
SELECT * FROM profiles WHERE id = auth.uid();

-- Check RLS is enabled
SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles';
```

**Solution**:
- Verify user is properly authenticated
- Check JWT token is valid
- Ensure profile was created during signup

### Issue: Caregivers Can't Access Patient Data

**Symptoms**:
- Caregiver sees empty dashboard
- Patient data not visible

**Diagnosis**:
```sql
-- Check care relationship exists
SELECT * FROM care_relationships
WHERE caregiver_id = auth.uid();

-- Check relationship status
SELECT patient_id, status, can_view_health_data, can_receive_alerts
FROM care_relationships
WHERE caregiver_id = auth.uid();

-- Test helper function
SELECT public.can_view_patient_health_data(auth.uid(), 'PATIENT_ID');
```

**Solution**:
- Verify care relationship status is 'active'
- Check permission flags are true
- Ensure caregiver accepted invitation

### Issue: Admin Can't Access Data

**Symptoms**:
- Admin dashboard shows limited data
- Admin operations failing

**Diagnosis**:
```sql
-- Check admin role
SELECT id, role FROM profiles WHERE id = auth.uid();

-- Test admin function
SELECT public.is_admin(auth.uid());
```

**Solution**:
- Verify user's role is set to 'admin' in profiles table
- Check helper function is working
- Ensure admin is authenticated

### Issue: Performance Degradation

**Symptoms**:
- Slow query response times
- Timeouts

**Diagnosis**:
```sql
-- Check if indexes exist
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND (indexname LIKE '%role%' OR indexname LIKE '%caregiver%');

-- Analyze slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Solution**:
- Verify RLS performance indexes exist
- Run ANALYZE on tables
- Consider query optimization
- Check connection pool settings

---

## Support and Escalation

### Level 1: Development Team
- Application integration issues
- Query optimization
- Error handling

### Level 2: Database Administrator
- RLS policy issues
- Performance problems
- Schema changes

### Level 3: Security Team
- Security incidents
- Access control violations
- HIPAA compliance issues

### Emergency Contact
- **Email**: emergency-access@paraconnect.com
- **Phone**: [Emergency Contact Number]
- **On-Call**: [PagerDuty/On-Call System]

---

## Success Criteria

Deployment is considered successful when:

- [ ] All 8 tables have RLS enabled
- [ ] 32 policies deployed and active
- [ ] 5 helper functions working
- [ ] All verification tests pass
- [ ] Application functionality intact
- [ ] No increase in error rates
- [ ] Query performance acceptable
- [ ] No security violations detected
- [ ] Team trained on new policies
- [ ] Documentation updated

---

## Compliance Checklist

For HIPAA compliance documentation:

- [ ] RLS policies deployed and verified
- [ ] Access controls documented
- [ ] Audit trail enabled (activity_log)
- [ ] Security incident response plan updated
- [ ] Compliance officer notified
- [ ] Security Risk Assessment updated
- [ ] Policies and Procedures updated
- [ ] Workforce training completed
- [ ] Business Associate Agreements reviewed

---

## References

- **Full Documentation**: `RLS_POLICIES_DOCUMENTATION.md`
- **Test Suite**: `20251012000002_rls_policy_tests.sql`
- **Migration File**: `20251012000001_comprehensive_rls_policies.sql`
- **Supabase RLS Docs**: https://supabase.com/docs/guides/auth/row-level-security
- **Postgres RLS Docs**: https://www.postgresql.org/docs/current/ddl-rowsecurity.html

---

**Document Version**: 1.0
**Last Updated**: 2025-10-12
**Maintained By**: Database Administration Team
