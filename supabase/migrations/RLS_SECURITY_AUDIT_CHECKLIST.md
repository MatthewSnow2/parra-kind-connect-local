# RLS Security Audit Checklist

**Para Connect - Row-Level Security Audit**

Use this checklist for regular security audits and compliance reviews.

---

## Audit Information

**Audit Date**: ___________________
**Auditor Name**: ___________________
**Environment**: ☐ Development  ☐ Staging  ☐ Production
**Audit Type**: ☐ Routine  ☐ Incident Response  ☐ Compliance  ☐ Pre-Release

---

## Section 1: RLS Configuration Verification

### 1.1 RLS Enabled Status
Run this query and verify all tables show "✓ ENABLED":
```sql
SELECT tablename,
       CASE WHEN relrowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED - CRITICAL' END as status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'care_relationships', 'check_ins', 'daily_summaries',
                    'alerts', 'caregiver_notes', 'activity_log', 'waitlist_signups')
ORDER BY tablename;
```

| Table | RLS Status | ✓/✗ |
|-------|------------|-----|
| profiles | ☐ Enabled | ☐ |
| care_relationships | ☐ Enabled | ☐ |
| check_ins | ☐ Enabled | ☐ |
| daily_summaries | ☐ Enabled | ☐ |
| alerts | ☐ Enabled | ☐ |
| caregiver_notes | ☐ Enabled | ☐ |
| activity_log | ☐ Enabled | ☐ |
| waitlist_signups | ☐ Enabled | ☐ |

**Result**: ☐ PASS (All enabled)  ☐ FAIL (One or more disabled)

---

### 1.2 Policy Count Verification
Expected: 4 policies per table (32 total)

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'care_relationships', 'check_ins', 'daily_summaries',
                    'alerts', 'caregiver_notes', 'activity_log', 'waitlist_signups')
GROUP BY tablename
ORDER BY tablename;
```

| Table | Expected | Actual | ✓/✗ |
|-------|----------|--------|-----|
| profiles | 4 | ____ | ☐ |
| care_relationships | 4 | ____ | ☐ |
| check_ins | 4 | ____ | ☐ |
| daily_summaries | 4 | ____ | ☐ |
| alerts | 4 | ____ | ☐ |
| caregiver_notes | 4 | ____ | ☐ |
| activity_log | 4 | ____ | ☐ |
| waitlist_signups | 4 | ____ | ☐ |
| **TOTAL** | **32** | ____ | ☐ |

**Result**: ☐ PASS (All counts correct)  ☐ FAIL (Missing policies)

---

### 1.3 Helper Functions Verification

```sql
SELECT proname, prokind, prosecdef
FROM pg_proc
WHERE proname IN ('is_admin', 'has_active_care_relationship',
                  'can_view_patient_health_data', 'can_receive_patient_alerts',
                  'can_modify_patient_settings');
```

| Function | Exists | SECURITY DEFINER | ✓/✗ |
|----------|--------|------------------|-----|
| is_admin | ☐ | ☐ | ☐ |
| has_active_care_relationship | ☐ | ☐ | ☐ |
| can_view_patient_health_data | ☐ | ☐ | ☐ |
| can_receive_patient_alerts | ☐ | ☐ | ☐ |
| can_modify_patient_settings | ☐ | ☐ | ☐ |

**Result**: ☐ PASS (All functions exist)  ☐ FAIL (Missing functions)

---

## Section 2: Access Control Testing

### 2.1 User Isolation Test
Test that users can only access their own data.

**Test User 1**: __________________ (ID: ________________________)
**Test User 2**: __________________ (ID: ________________________)

```sql
-- As User 1: Try to view User 2's profile
SELECT * FROM profiles WHERE id = 'user-2-id';
-- Expected: Empty result
```

- ☐ User 1 cannot see User 2's profile
- ☐ User 1 can see own profile
- ☐ User 2 cannot see User 1's profile
- ☐ User 2 can see own profile

**Result**: ☐ PASS  ☐ FAIL

---

### 2.2 Care Relationship Access Test

**Patient**: __________________ (ID: ________________________)
**Authorized Caregiver**: __________________ (ID: ________________________)
**Unauthorized User**: __________________ (ID: ________________________)

Create test care relationship:
```sql
INSERT INTO care_relationships (patient_id, caregiver_id, status, can_view_health_data)
VALUES ('patient-id', 'caregiver-id', 'active', true);
```

Test 1: Authorized Caregiver Access
```sql
-- As caregiver: View patient check-ins
SELECT COUNT(*) FROM check_ins WHERE patient_id = 'patient-id';
```
- ☐ Caregiver can view patient check-ins
- ☐ Caregiver can view patient summaries
- ☐ Caregiver can view patient alerts (if can_receive_alerts=true)

Test 2: Unauthorized User Access
```sql
-- As unauthorized user: Try to view patient data
SELECT COUNT(*) FROM check_ins WHERE patient_id = 'patient-id';
-- Expected: 0 or permission denied
```
- ☐ Unauthorized user cannot see patient check-ins
- ☐ Unauthorized user cannot see patient summaries
- ☐ Unauthorized user cannot see patient alerts

**Result**: ☐ PASS  ☐ FAIL

---

### 2.3 Admin Access Test

**Admin User**: __________________ (ID: ________________________)

Verify admin role:
```sql
SELECT role FROM profiles WHERE id = 'admin-id';
-- Expected: 'admin'
```

Test admin access:
```sql
-- Admin should see all profiles
SELECT COUNT(*) FROM profiles;
-- Expected: All profiles count

-- Admin should see all care relationships
SELECT COUNT(*) FROM care_relationships;
-- Expected: All relationships count
```

- ☐ Admin has role = 'admin'
- ☐ Admin can view all profiles
- ☐ Admin can view all care relationships
- ☐ Admin can view all check_ins
- ☐ Admin can view all alerts
- ☐ Admin can update any record
- ☐ Admin can delete records

**Result**: ☐ PASS  ☐ FAIL

---

### 2.4 Permission Flags Test

**Test Caregiver**: __________________ (ID: ________________________)
**Test Patient**: __________________ (ID: ________________________)

Scenario 1: can_view_health_data = false
```sql
UPDATE care_relationships
SET can_view_health_data = false
WHERE caregiver_id = 'caregiver-id' AND patient_id = 'patient-id';

-- As caregiver: Try to view check-ins
SELECT COUNT(*) FROM check_ins WHERE patient_id = 'patient-id';
-- Expected: 0 (access denied)
```
- ☐ Caregiver cannot view check-ins when can_view_health_data=false

Scenario 2: can_receive_alerts = false
```sql
UPDATE care_relationships
SET can_receive_alerts = false
WHERE caregiver_id = 'caregiver-id' AND patient_id = 'patient-id';

-- As caregiver: Try to view alerts
SELECT COUNT(*) FROM alerts WHERE patient_id = 'patient-id';
-- Expected: 0 (access denied)
```
- ☐ Caregiver cannot view alerts when can_receive_alerts=false

Scenario 3: status = 'inactive'
```sql
UPDATE care_relationships
SET status = 'inactive'
WHERE caregiver_id = 'caregiver-id' AND patient_id = 'patient-id';

-- As caregiver: Try to view any patient data
SELECT COUNT(*) FROM daily_summaries WHERE patient_id = 'patient-id';
-- Expected: 0 (access denied)
```
- ☐ Caregiver cannot view patient data when relationship is inactive

**Result**: ☐ PASS  ☐ FAIL

---

## Section 3: Data Modification Controls

### 3.1 Patient Alert Modification Test
Patients should NOT be able to modify their own alerts (safety feature).

```sql
-- As patient: Try to dismiss own alert
UPDATE alerts
SET status = 'resolved'
WHERE patient_id = auth.uid() AND id = 'test-alert-id';
-- Expected: 0 rows updated (permission denied)
```

- ☐ Patient cannot update own alerts
- ☐ Patient CAN view own alerts
- ☐ Caregiver CAN update patient alerts (if authorized)

**Result**: ☐ PASS  ☐ FAIL

---

### 3.2 Check-In Modification Test
Only patients and admins should be able to modify check-ins.

```sql
-- As caregiver: Try to modify patient check-in
UPDATE check_ins
SET mood_detected = 'happy'
WHERE patient_id = 'patient-id' AND id = 'test-checkin-id';
-- Expected: 0 rows updated (permission denied)
```

- ☐ Caregiver cannot modify patient check-ins
- ☐ Patient CAN modify own check-ins
- ☐ Admin CAN modify any check-ins

**Result**: ☐ PASS  ☐ FAIL

---

### 3.3 Profile Role Escalation Test
Users should NOT be able to change their own role.

```sql
-- As regular user: Try to make self admin
UPDATE profiles
SET role = 'admin'
WHERE id = auth.uid();
-- Expected: 0 rows updated or error
```

- ☐ User cannot change own role to admin
- ☐ User CAN update other profile fields
- ☐ Admin CAN change any user's role

**Result**: ☐ PASS  ☐ FAIL

---

### 3.4 Caregiver Note Sharing Test

Create test note:
```sql
INSERT INTO caregiver_notes (patient_id, caregiver_id, note_text, shared_with_patient, shared_with_care_team)
VALUES ('patient-id', 'caregiver-id', 'Test note', false, false);
```

Test visibility:
```sql
-- As patient: Try to view private note
SELECT COUNT(*) FROM caregiver_notes
WHERE patient_id = auth.uid() AND shared_with_patient = false;
-- Expected: 0

-- As other caregiver: Try to view private note
SELECT COUNT(*) FROM caregiver_notes
WHERE patient_id = 'patient-id' AND shared_with_care_team = false;
-- Expected: 0
```

- ☐ Patient cannot see notes with shared_with_patient=false
- ☐ Patient CAN see notes with shared_with_patient=true
- ☐ Care team cannot see notes with shared_with_care_team=false
- ☐ Care team CAN see notes with shared_with_care_team=true
- ☐ Note creator can ALWAYS see own notes

**Result**: ☐ PASS  ☐ FAIL

---

## Section 4: Performance & Optimization

### 4.1 Index Verification

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (indexname LIKE '%role%' OR indexname LIKE '%caregiver%' OR indexname LIKE '%status%')
ORDER BY indexname;
```

Required indexes:
- ☐ idx_profiles_role_id
- ☐ idx_care_relationships_caregiver_status
- ☐ idx_care_relationships_patient_status
- ☐ idx_care_relationships_permissions

**Result**: ☐ PASS  ☐ FAIL

---

### 4.2 Query Performance Test

Run EXPLAIN ANALYZE on common queries:

```sql
EXPLAIN ANALYZE
SELECT * FROM check_ins WHERE patient_id = 'test-patient-id';
```

| Query | Execution Time | Uses Index | ✓/✗ |
|-------|----------------|------------|-----|
| SELECT own profile | _____ ms | ☐ | ☐ |
| SELECT own check_ins | _____ ms | ☐ | ☐ |
| SELECT with care relationship | _____ ms | ☐ | ☐ |
| Complex JOIN with RLS | _____ ms | ☐ | ☐ |

Target: All queries < 100ms

**Result**: ☐ PASS  ☐ FAIL

---

## Section 5: Audit & Compliance

### 5.1 Activity Logging

Verify activity_log is capturing events:

```sql
SELECT COUNT(*), activity_type
FROM activity_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY activity_type;
```

- ☐ Login events are logged
- ☐ Profile updates are logged
- ☐ Security events are logged
- ☐ Activity log has appropriate retention

**Result**: ☐ PASS  ☐ FAIL

---

### 5.2 PHI Access Audit

Review recent PHI access:

```sql
SELECT user_id, activity_type, COUNT(*)
FROM activity_log
WHERE activity_type IN ('phi_access', 'check_in', 'alert_sent', 'alert_acknowledged')
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id, activity_type;
```

- ☐ PHI access is being logged
- ☐ No unauthorized access patterns detected
- ☐ Access is appropriate for user roles
- ☐ Audit trail is complete

**Result**: ☐ PASS  ☐ FAIL

---

### 5.3 User Access Review

Review admin users:

```sql
SELECT id, email, full_name, role, created_at, last_active_at
FROM profiles
WHERE role = 'admin'
ORDER BY last_active_at DESC;
```

| Admin Email | Last Active | Authorized | Action Needed |
|-------------|-------------|------------|---------------|
| | | ☐ | |
| | | ☐ | |
| | | ☐ | |

- ☐ All admin users are authorized
- ☐ No orphaned admin accounts
- ☐ Admin access is documented
- ☐ Admin activity is regularly reviewed

**Result**: ☐ PASS  ☐ FAIL

---

## Section 6: Security Incidents

### 6.1 Recent Security Events

```sql
SELECT *
FROM activity_log
WHERE activity_type = 'security_event'
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

Number of security events: __________

- ☐ All security events have been reviewed
- ☐ All incidents have been documented
- ☐ Appropriate action has been taken
- ☐ Policies have been updated if needed

**Result**: ☐ PASS  ☐ FAIL

---

### 6.2 Failed Access Attempts

Review Supabase logs for RLS policy violations:

- ☐ No excessive failed access attempts
- ☐ No brute force patterns detected
- ☐ No unauthorized access patterns
- ☐ All violations have been investigated

**Result**: ☐ PASS  ☐ FAIL

---

## Section 7: HIPAA Compliance

### 7.1 Access Control (§164.312(a)(1))

- ☐ Unique user identification implemented (Supabase Auth)
- ☐ Emergency access procedure documented (admin role)
- ☐ Automatic logoff implemented (session timeout)
- ☐ Encryption and decryption implemented

**Result**: ☐ PASS  ☐ FAIL

---

### 7.2 Audit Controls (§164.312(b))

- ☐ Audit logs capture hardware, software, and procedures
- ☐ PHI access is logged
- ☐ Audit logs are protected from modification
- ☐ Audit logs have appropriate retention

**Result**: ☐ PASS  ☐ FAIL

---

### 7.3 Integrity (§164.312(c)(1))

- ☐ Mechanisms to prevent unauthorized PHI alteration
- ☐ Electronic signatures if required
- ☐ Data integrity controls in place
- ☐ Unauthorized modifications detected

**Result**: ☐ PASS  ☐ FAIL

---

### 7.4 Transmission Security (§164.312(e)(1))

- ☐ Technical security for PHI transmission
- ☐ Encryption during transmission
- ☐ Network security controls
- ☐ Access controls for transmissions

**Result**: ☐ PASS (Application layer)  ☐ FAIL

---

## Section 8: Disaster Recovery

### 8.1 Backup Verification

```sql
-- Check last backup timestamp
SELECT MAX(created_at) as last_backup
FROM activity_log
WHERE activity_type = 'backup_completed';
```

Last backup: __________________

- ☐ Regular backups are scheduled
- ☐ Backups are tested regularly
- ☐ Backup retention meets requirements
- ☐ Restore procedure is documented

**Result**: ☐ PASS  ☐ FAIL

---

### 8.2 RLS Resilience

- ☐ RLS policies survive database restore
- ☐ RLS verification is part of restore procedure
- ☐ Emergency disable procedure is documented
- ☐ Re-enable procedure is documented

**Result**: ☐ PASS  ☐ FAIL

---

## Section 9: Documentation Review

### 9.1 Documentation Completeness

- ☐ RLS_POLICIES_DOCUMENTATION.md is up to date
- ☐ RLS_DEPLOYMENT_GUIDE.md is current
- ☐ RLS_QUICK_REFERENCE.md is accurate
- ☐ This audit checklist is current
- ☐ Emergency procedures are documented
- ☐ Contact information is current

**Result**: ☐ PASS  ☐ FAIL

---

### 9.2 Training & Awareness

- ☐ Development team trained on RLS policies
- ☐ Support team knows emergency procedures
- ☐ Security team reviews policies regularly
- ☐ Compliance officer is informed

**Result**: ☐ PASS  ☐ FAIL

---

## Section 10: Overall Assessment

### Summary of Findings

**Critical Issues** (Require immediate action):
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**High Priority Issues** (Resolve within 1 week):
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Medium Priority Issues** (Resolve within 1 month):
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Low Priority Issues** (Document for next review):
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

### Overall Audit Result

**Total Sections**: 10
**Sections Passed**: ____ / 10
**Pass Rate**: _____%

**Overall Result**:
- ☐ PASS (All critical and high priority items passed)
- ☐ CONDITIONAL PASS (Minor issues identified, action plan in place)
- ☐ FAIL (Critical security issues identified, immediate action required)

---

### Required Actions

| Action | Priority | Assigned To | Due Date | Status |
|--------|----------|-------------|----------|--------|
| | | | | ☐ |
| | | | | ☐ |
| | | | | ☐ |
| | | | | ☐ |

---

### Next Audit Schedule

**Next Routine Audit**: __________________
**Next Compliance Audit**: __________________
**Quarterly Review**: __________________

---

## Signatures

**Auditor**: _________________________ Date: _____________

**Security Officer**: _________________________ Date: _____________

**Compliance Officer**: _________________________ Date: _____________

**Database Administrator**: _________________________ Date: _____________

---

## Appendix: Quick SQL Tests

Copy and paste these for quick verification:

```sql
-- Test 1: Verify RLS enabled
SELECT COUNT(*) as should_be_8
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
  AND relrowsecurity = true
  AND tablename IN ('profiles', 'care_relationships', 'check_ins', 'daily_summaries',
                    'alerts', 'caregiver_notes', 'activity_log', 'waitlist_signups');

-- Test 2: Verify policy count
SELECT COUNT(*) as should_be_32
FROM pg_policies
WHERE schemaname = 'public';

-- Test 3: Verify helper functions
SELECT COUNT(*) as should_be_5
FROM pg_proc
WHERE proname IN ('is_admin', 'has_active_care_relationship',
                  'can_view_patient_health_data', 'can_receive_patient_alerts',
                  'can_modify_patient_settings');

-- Test 4: Verify indexes
SELECT COUNT(*) as should_be_at_least_4
FROM pg_indexes
WHERE schemaname = 'public'
  AND (indexname LIKE '%role%' OR indexname LIKE '%caregiver%');

-- All tests should return expected values
```

---

**End of Audit Checklist**

Print this checklist and complete during security audits. Keep completed checklists for compliance documentation.
