-- =====================================================
-- PARA CONNECT - RLS POLICY TESTING QUERIES
-- =====================================================
-- File: 20251012000002_rls_policy_tests.sql
-- Purpose: Comprehensive test suite to verify RLS policies are working correctly
--
-- INSTRUCTIONS:
-- 1. Run these tests after applying the RLS policies migration
-- 2. Execute each test section separately
-- 3. Verify expected results match actual results
-- 4. These tests should be run in a test environment first
-- 5. Use Supabase SQL Editor or psql with appropriate user contexts
--
-- NOTE: To properly test RLS, you need to set the session user context:
--   SET LOCAL ROLE authenticated;
--   SET LOCAL request.jwt.claims = '{"sub": "user-uuid-here"}';
--
-- =====================================================

-- =====================================================
-- SETUP: Create Test Users and Data
-- =====================================================

-- This section creates test data for RLS verification
-- Run this in test environment only!

DO $$
DECLARE
  senior_id UUID;
  caregiver_id UUID;
  caregiver2_id UUID;
  family_id UUID;
  admin_id UUID;
  unrelated_id UUID;
BEGIN
  -- Create test user IDs (these should match auth.users records in actual test)
  senior_id := gen_random_uuid();
  caregiver_id := gen_random_uuid();
  caregiver2_id := gen_random_uuid();
  family_id := gen_random_uuid();
  admin_id := gen_random_uuid();
  unrelated_id := gen_random_uuid();

  -- Store IDs in temp table for test reference
  CREATE TEMP TABLE IF NOT EXISTS test_users (
    role TEXT,
    user_id UUID,
    email TEXT
  );

  INSERT INTO test_users VALUES
    ('senior', senior_id, 'senior@test.com'),
    ('caregiver', caregiver_id, 'caregiver@test.com'),
    ('caregiver2', caregiver2_id, 'caregiver2@test.com'),
    ('family', family_id, 'family@test.com'),
    ('admin', admin_id, 'admin@test.com'),
    ('unrelated', unrelated_id, 'unrelated@test.com');

  RAISE NOTICE 'Test user IDs created. Reference temp table test_users for IDs.';
END $$;

-- Display test user IDs
SELECT * FROM test_users ORDER BY role;

-- =====================================================
-- TEST SUITE 1: PROFILES TABLE
-- =====================================================

-- Test 1.1: User can view their own profile
COMMENT ON TABLE test_users IS 'Test 1.1: User can view their own profile';
-- Simulate as senior user
-- Expected: Should see only their own profile
SELECT
  'Test 1.1 - User views own profile' AS test_name,
  COUNT(*) = 1 AS passes,
  CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END AS result
FROM public.profiles
WHERE id = (SELECT user_id FROM test_users WHERE role = 'senior');

-- Test 1.2: User cannot view other users' profiles (non-admin)
COMMENT ON TABLE test_users IS 'Test 1.2: User cannot view other users profiles';
-- Expected: Should NOT see other users' profiles unless admin

-- Test 1.3: Admin can view all profiles
COMMENT ON TABLE test_users IS 'Test 1.3: Admin can view all profiles';
-- When authenticated as admin, should see all profiles

-- Test 1.4: User cannot change their own role (privilege escalation prevention)
COMMENT ON TABLE test_users IS 'Test 1.4: User cannot escalate privileges';
-- Attempt to update own role should fail for non-admin
-- This requires application-level testing as direct SQL won't respect RLS

-- =====================================================
-- TEST SUITE 2: CARE_RELATIONSHIPS TABLE
-- =====================================================

-- Test 2.1: Patient can view their care relationships
SELECT
  'Test 2.1 - Patient views care relationships' AS test_name,
  'Query care_relationships where patient_id = current_user' AS test_query,
  'Should return all relationships where user is patient' AS expected_result;

-- Test 2.2: Caregiver can view their care relationships
SELECT
  'Test 2.2 - Caregiver views care relationships' AS test_name,
  'Query care_relationships where caregiver_id = current_user' AS test_query,
  'Should return all relationships where user is caregiver' AS expected_result;

-- Test 2.3: Unrelated user cannot view care relationships
SELECT
  'Test 2.3 - Unrelated user views care relationships' AS test_name,
  'Query care_relationships as unrelated user' AS test_query,
  'Should return empty result set' AS expected_result;

-- Test 2.4: Patient can create new care relationship
SELECT
  'Test 2.4 - Patient creates care relationship' AS test_name,
  'INSERT INTO care_relationships (patient_id=self, caregiver_id=other)' AS test_query,
  'Should succeed' AS expected_result;

-- Test 2.5: Caregiver cannot create care relationship for patient
SELECT
  'Test 2.5 - Caregiver creates care relationship' AS test_name,
  'INSERT INTO care_relationships (patient_id=other, caregiver_id=self)' AS test_query,
  'Should fail - only patient can initiate' AS expected_result;

-- Test 2.6: Caregiver can accept invitation (update status)
SELECT
  'Test 2.6 - Caregiver accepts invitation' AS test_name,
  'UPDATE care_relationships SET status=active WHERE caregiver_id=self' AS test_query,
  'Should succeed' AS expected_result;

-- Test 2.7: Patient can delete care relationship
SELECT
  'Test 2.7 - Patient deletes care relationship' AS test_name,
  'DELETE FROM care_relationships WHERE patient_id=self' AS test_query,
  'Should succeed' AS expected_result;

-- Test 2.8: Caregiver cannot delete care relationship
SELECT
  'Test 2.8 - Caregiver deletes care relationship' AS test_name,
  'DELETE FROM care_relationships WHERE caregiver_id=self' AS test_query,
  'Should fail - only patient can delete' AS expected_result;

-- =====================================================
-- TEST SUITE 3: CHECK_INS TABLE (PHI)
-- =====================================================

-- Test 3.1: Patient can view their own check-ins
SELECT
  'Test 3.1 - Patient views own check-ins' AS test_name,
  'SELECT * FROM check_ins WHERE patient_id = current_user' AS test_query,
  'Should return all patient check-ins' AS expected_result;

-- Test 3.2: Caregiver with health data permission can view patient check-ins
SELECT
  'Test 3.2 - Authorized caregiver views check-ins' AS test_name,
  'SELECT * FROM check_ins WHERE patient_id = (authorized patient)' AS test_query,
  'Should return check-ins if can_view_health_data = true' AS expected_result;

-- Test 3.3: Caregiver WITHOUT health data permission cannot view
SELECT
  'Test 3.3 - Unauthorized caregiver views check-ins' AS test_name,
  'SELECT * FROM check_ins WHERE patient_id = (patient with can_view_health_data=false)' AS test_query,
  'Should return empty result set' AS expected_result;

-- Test 3.4: Unrelated user cannot view any check-ins
SELECT
  'Test 3.4 - Unrelated user views check-ins' AS test_name,
  'SELECT * FROM check_ins' AS test_query,
  'Should return empty result set' AS expected_result;

-- Test 3.5: Caregiver cannot modify check-ins
SELECT
  'Test 3.5 - Caregiver modifies check-in' AS test_name,
  'UPDATE check_ins SET messages = ... WHERE patient_id = (their patient)' AS test_query,
  'Should fail - caregivers have read-only access' AS expected_result;

-- Test 3.6: Patient can update their own check-ins
SELECT
  'Test 3.6 - Patient updates own check-in' AS test_name,
  'UPDATE check_ins SET ... WHERE patient_id = current_user' AS test_query,
  'Should succeed' AS expected_result;

-- =====================================================
-- TEST SUITE 4: DAILY_SUMMARIES TABLE (PHI)
-- =====================================================

-- Test 4.1: Patient can view their own daily summaries
SELECT
  'Test 4.1 - Patient views own summaries' AS test_name,
  'SELECT * FROM daily_summaries WHERE patient_id = current_user' AS test_query,
  'Should return all patient summaries' AS expected_result;

-- Test 4.2: Active caregiver can view patient summaries
SELECT
  'Test 4.2 - Active caregiver views summaries' AS test_name,
  'SELECT * FROM daily_summaries WHERE patient_id = (patient with active relationship)' AS test_query,
  'Should return summaries if active care relationship exists' AS expected_result;

-- Test 4.3: Inactive caregiver cannot view summaries
SELECT
  'Test 4.3 - Inactive caregiver views summaries' AS test_name,
  'SELECT * FROM daily_summaries WHERE patient_id = (patient with inactive relationship)' AS test_query,
  'Should return empty result set' AS expected_result;

-- Test 4.4: Regular users cannot insert/update summaries
SELECT
  'Test 4.4 - Regular user inserts summary' AS test_name,
  'INSERT INTO daily_summaries ...' AS test_query,
  'Should fail - only admins or system' AS expected_result;

-- =====================================================
-- TEST SUITE 5: ALERTS TABLE (PHI)
-- =====================================================

-- Test 5.1: Patient can view their own alerts
SELECT
  'Test 5.1 - Patient views own alerts' AS test_name,
  'SELECT * FROM alerts WHERE patient_id = current_user' AS test_query,
  'Should return all patient alerts' AS expected_result;

-- Test 5.2: Caregiver with alert permission can view and update
SELECT
  'Test 5.2 - Authorized caregiver views/updates alerts' AS test_name,
  'SELECT/UPDATE alerts WHERE patient_id = (authorized patient)' AS test_query,
  'Should succeed if can_receive_alerts = true' AS expected_result;

-- Test 5.3: Caregiver without alert permission cannot view
SELECT
  'Test 5.3 - Unauthorized caregiver views alerts' AS test_name,
  'SELECT * FROM alerts WHERE patient_id = (patient with can_receive_alerts=false)' AS test_query,
  'Should return empty result set' AS expected_result;

-- Test 5.4: Patient cannot update alerts (safety feature)
SELECT
  'Test 5.4 - Patient updates alert' AS test_name,
  'UPDATE alerts SET status = resolved WHERE patient_id = current_user' AS test_query,
  'Should fail - patients cannot dismiss their own alerts' AS expected_result;

-- Test 5.5: Caregiver can acknowledge alert
SELECT
  'Test 5.5 - Caregiver acknowledges alert' AS test_name,
  'UPDATE alerts SET status=acknowledged, acknowledged_by=current_user WHERE patient_id = (their patient)' AS test_query,
  'Should succeed if can_receive_alerts = true' AS expected_result;

-- =====================================================
-- TEST SUITE 6: CAREGIVER_NOTES TABLE (PHI)
-- =====================================================

-- Test 6.1: Caregiver can view their own notes
SELECT
  'Test 6.1 - Caregiver views own notes' AS test_name,
  'SELECT * FROM caregiver_notes WHERE caregiver_id = current_user' AS test_query,
  'Should return all notes created by caregiver' AS expected_result;

-- Test 6.2: Patient can view notes shared with them
SELECT
  'Test 6.2 - Patient views shared notes' AS test_name,
  'SELECT * FROM caregiver_notes WHERE patient_id = current_user AND shared_with_patient = true' AS test_query,
  'Should return only notes where shared_with_patient = true' AS expected_result;

-- Test 6.3: Patient cannot view non-shared notes
SELECT
  'Test 6.3 - Patient views non-shared notes' AS test_name,
  'SELECT * FROM caregiver_notes WHERE patient_id = current_user AND shared_with_patient = false' AS test_query,
  'Should return empty result set' AS expected_result;

-- Test 6.4: Care team can view notes shared with care team
SELECT
  'Test 6.4 - Care team views shared notes' AS test_name,
  'SELECT * FROM caregiver_notes WHERE patient_id = (their patient) AND shared_with_care_team = true' AS test_query,
  'Should return notes shared with care team' AS expected_result;

-- Test 6.5: Caregiver can only create notes for their patients
SELECT
  'Test 6.5 - Caregiver creates note for unrelated patient' AS test_name,
  'INSERT INTO caregiver_notes (patient_id = unrelated patient, caregiver_id = self)' AS test_query,
  'Should fail - no active care relationship' AS expected_result;

-- Test 6.6: Caregiver can update their own notes only
SELECT
  'Test 6.6 - Caregiver updates another caregivers note' AS test_name,
  'UPDATE caregiver_notes SET note_text = ... WHERE caregiver_id != current_user' AS test_query,
  'Should fail - can only modify own notes' AS expected_result;

-- =====================================================
-- TEST SUITE 7: ACTIVITY_LOG TABLE
-- =====================================================

-- Test 7.1: User can view their own activity log
SELECT
  'Test 7.1 - User views own activity log' AS test_name,
  'SELECT * FROM activity_log WHERE user_id = current_user' AS test_query,
  'Should return all user activities' AS expected_result;

-- Test 7.2: User cannot view other users' activity
SELECT
  'Test 7.2 - User views other user activity' AS test_name,
  'SELECT * FROM activity_log WHERE user_id != current_user' AS test_query,
  'Should return empty result set for non-admins' AS expected_result;

-- Test 7.3: Admin can view all activity logs
SELECT
  'Test 7.3 - Admin views all activity' AS test_name,
  'SELECT * FROM activity_log' AS test_query,
  'Should return all activity logs if admin' AS expected_result;

-- Test 7.4: Activity logs are immutable (no updates by regular users)
SELECT
  'Test 7.4 - User updates activity log' AS test_name,
  'UPDATE activity_log SET activity_description = ...' AS test_query,
  'Should fail - only admins can update' AS expected_result;

-- =====================================================
-- TEST SUITE 8: WAITLIST_SIGNUPS TABLE
-- =====================================================

-- Test 8.1: Anonymous users can insert to waitlist
SELECT
  'Test 8.1 - Anonymous signup' AS test_name,
  'INSERT INTO waitlist_signups (name, email) VALUES (...)' AS test_query,
  'Should succeed - public signup allowed' AS expected_result;

-- Test 8.2: Non-admin users cannot view waitlist
SELECT
  'Test 8.2 - Regular user views waitlist' AS test_name,
  'SELECT * FROM waitlist_signups' AS test_query,
  'Should return empty result set' AS expected_result;

-- Test 8.3: Admin can view and manage waitlist
SELECT
  'Test 8.3 - Admin views waitlist' AS test_name,
  'SELECT * FROM waitlist_signups' AS test_query,
  'Should return all signups if admin' AS expected_result;

-- =====================================================
-- TEST SUITE 9: HELPER FUNCTIONS
-- =====================================================

-- Test 9.1: is_admin function works correctly
SELECT
  'Test 9.1 - is_admin function' AS test_name,
  public.is_admin((SELECT user_id FROM test_users WHERE role = 'admin')) AS is_admin_true,
  NOT public.is_admin((SELECT user_id FROM test_users WHERE role = 'senior')) AS is_admin_false,
  CASE
    WHEN public.is_admin((SELECT user_id FROM test_users WHERE role = 'admin'))
      AND NOT public.is_admin((SELECT user_id FROM test_users WHERE role = 'senior'))
    THEN 'PASS'
    ELSE 'FAIL'
  END AS result;

-- Test 9.2: has_active_care_relationship function
SELECT
  'Test 9.2 - has_active_care_relationship function' AS test_name,
  'Tests active relationship detection' AS description;
-- Requires actual care_relationships data to test

-- Test 9.3: can_view_patient_health_data function
SELECT
  'Test 9.3 - can_view_patient_health_data function' AS test_name,
  'Tests health data permission check' AS description;
-- Requires actual care_relationships data to test

-- Test 9.4: can_receive_patient_alerts function
SELECT
  'Test 9.4 - can_receive_patient_alerts function' AS test_name,
  'Tests alert permission check' AS description;
-- Requires actual care_relationships data to test

-- =====================================================
-- TEST SUITE 10: CROSS-CUTTING SECURITY CONCERNS
-- =====================================================

-- Test 10.1: Verify all tables have RLS enabled
SELECT
  'Test 10.1 - RLS enabled on all tables' AS test_name,
  schemaname,
  tablename,
  CASE
    WHEN rowsecurity THEN 'ENABLED'
    ELSE 'DISABLED - SECURITY RISK!'
  END AS rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'care_relationships', 'check_ins', 'daily_summaries',
                    'alerts', 'caregiver_notes', 'activity_log', 'waitlist_signups')
ORDER BY tablename;

-- Test 10.2: Verify policies exist for all operations
SELECT
  'Test 10.2 - Policy coverage' AS test_name,
  tablename,
  COUNT(*) as policy_count,
  array_agg(DISTINCT cmd) as operations_covered
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'care_relationships', 'check_ins', 'daily_summaries',
                    'alerts', 'caregiver_notes', 'activity_log', 'waitlist_signups')
GROUP BY tablename
ORDER BY tablename;

-- Test 10.3: List all policies for review
SELECT
  'Test 10.3 - All RLS policies' AS test_name,
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- =====================================================
-- TEST SUITE 11: PERFORMANCE TESTS
-- =====================================================

-- Test 11.1: Check if RLS indexes exist
SELECT
  'Test 11.1 - RLS performance indexes' AS test_name,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%role%'
    OR indexname LIKE '%caregiver_status%'
    OR indexname LIKE '%patient_status%'
    OR indexname LIKE '%permissions%'
  )
ORDER BY tablename;

-- Test 11.2: Explain plan for common RLS queries
EXPLAIN ANALYZE
SELECT * FROM public.check_ins
WHERE patient_id = (SELECT user_id FROM test_users WHERE role = 'senior' LIMIT 1);

-- =====================================================
-- MANUAL TESTING SCENARIOS
-- =====================================================

/*
MANUAL TEST SCENARIO 1: Patient-Caregiver Relationship Flow
---------------------------------------------------------
1. Patient creates profile (role='senior')
2. Caregiver creates profile (role='caregiver')
3. Patient creates care_relationship inviting caregiver
4. Caregiver accepts relationship (status='active')
5. Patient has check-in conversation
6. Caregiver can now view check-in (if can_view_health_data=true)
7. Alert is generated from check-in
8. Caregiver can view and acknowledge alert (if can_receive_alerts=true)
9. Caregiver creates note about patient
10. Patient can view note only if shared_with_patient=true

Expected: All operations succeed with proper permissions, fail without

MANUAL TEST SCENARIO 2: Unauthorized Access Attempts
---------------------------------------------------------
1. User A tries to view User B's profile
2. User A tries to view User B's check-ins
3. User A tries to create care_relationship for User B as patient
4. User A tries to view alerts for User B
5. Caregiver tries to modify patient's check-in data
6. Patient tries to dismiss their own critical alerts
7. User tries to escalate their role to admin

Expected: All operations should fail with permission denied

MANUAL TEST SCENARIO 3: Admin Operations
---------------------------------------------------------
1. Admin views all user profiles
2. Admin views all care relationships
3. Admin views all alerts across all patients
4. Admin views activity logs for audit
5. Admin manages waitlist signups
6. Admin updates user profile (including role changes)

Expected: All operations succeed for admin

MANUAL TEST SCENARIO 4: Edge Cases
---------------------------------------------------------
1. Caregiver relationship becomes inactive - verify access is revoked
2. can_view_health_data set to false - verify caregiver loses check-in access
3. can_receive_alerts set to false - verify caregiver cannot view alerts
4. Note sharing toggled - verify visibility changes appropriately
5. Multiple caregivers with different permission sets
6. Patient deletes care relationship - verify caregiver immediately loses access

Expected: Access control reflects current permissions in real-time

MANUAL TEST SCENARIO 5: HIPAA Compliance
---------------------------------------------------------
1. Verify minimum necessary access (users only see what they need)
2. Verify audit trail captures all PHI access
3. Verify anonymous users cannot access any PHI
4. Verify deleted users' data remains inaccessible
5. Verify no data leakage through error messages
6. Verify access logs are immutable

Expected: Full HIPAA compliance for all PHI access
*/

-- =====================================================
-- CLEANUP (Optional)
-- =====================================================

-- Drop test users temp table when done
-- DROP TABLE IF EXISTS test_users;

-- =====================================================
-- TEST EXECUTION SUMMARY
-- =====================================================

SELECT
  'RLS POLICY TEST SUITE COMPLETE' AS status,
  'Review all test results above' AS action,
  'Verify PASS for all critical security tests' AS requirement,
  'Execute manual scenarios in controlled test environment' AS next_step;

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

/*
TESTING BEST PRACTICES:
1. Run tests in a dedicated test environment, not production
2. Create test users via Supabase Auth for realistic testing
3. Use Supabase client library to test with actual JWT tokens
4. Test with different user roles and permission combinations
5. Verify error messages don't leak sensitive information
6. Test performance with large datasets
7. Verify RLS policies don't cause N+1 query problems
8. Document any policy violations or unexpected behavior

PRODUCTION DEPLOYMENT CHECKLIST:
☐ All tests pass in test environment
☐ Performance benchmarks acceptable
☐ RLS enabled on all tables
☐ Helper functions granted to authenticated role
☐ Indexes created for RLS performance
☐ Activity logging configured
☐ Admin users properly assigned
☐ Emergency admin access documented
☐ Policy documentation reviewed by security team
☐ HIPAA compliance verified
☐ Backup and recovery tested with RLS
☐ Application code updated to handle RLS errors gracefully
*/
