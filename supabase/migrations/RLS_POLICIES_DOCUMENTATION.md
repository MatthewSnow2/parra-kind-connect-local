# Para Connect - Row-Level Security (RLS) Policies Documentation

## Overview

This document provides comprehensive documentation for all Row-Level Security (RLS) policies implemented in the Para Connect Supabase database. These policies are CRITICAL for HIPAA compliance and protecting Protected Health Information (PHI).

**Status**: Production-Ready Security Implementation
**Last Updated**: 2025-10-12
**Migration Files**:
- `20251012000001_comprehensive_rls_policies.sql` - Main RLS implementation
- `20251012000002_rls_policy_tests.sql` - Testing suite

---

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [HIPAA Compliance](#hipaa-compliance)
3. [Helper Functions](#helper-functions)
4. [Table-by-Table Policy Documentation](#table-by-table-policy-documentation)
5. [Access Control Matrix](#access-control-matrix)
6. [Common Scenarios](#common-scenarios)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)
9. [Emergency Procedures](#emergency-procedures)

---

## Security Architecture

### Principle: Defense in Depth

Para Connect implements multiple layers of security:

1. **Authentication Layer**: Supabase Auth handles user identity
2. **Row-Level Security**: Database-level access control (this document)
3. **Application Layer**: Additional business logic validation
4. **API Layer**: Rate limiting and request validation
5. **Audit Layer**: Activity logging for compliance

### RLS Implementation Strategy

- **Deny by Default**: All tables have RLS enabled; access is explicitly granted
- **Least Privilege**: Users receive minimum necessary permissions
- **Role-Based Access**: Four primary roles with distinct permissions
- **Relationship-Based Access**: Care relationships determine data access
- **Audit Trail**: All PHI access can be logged for compliance

### User Roles

| Role | Description | Typical Use Case |
|------|-------------|------------------|
| `senior` | Patient/Senior receiving care | The person being monitored and cared for |
| `caregiver` | Professional or informal caregiver | Nurse, aide, or family member providing care |
| `family_member` | Family member (may have caregiver relationship) | Adult child, spouse, relative |
| `admin` | System administrator | Platform management, support, compliance |

---

## HIPAA Compliance

### PHI Classification by Table

| Table | PHI Level | HIPAA Identifiers | Access Control |
|-------|-----------|-------------------|----------------|
| `profiles` | **HIGH** | Name, DOB, email, phone, address | User + Admin only |
| `check_ins` | **CRITICAL** | Health conversations, mood, safety concerns | Patient + Authorized caregivers + Admin |
| `daily_summaries` | **CRITICAL** | Health metrics, medication compliance | Patient + Active caregivers + Admin |
| `alerts` | **CRITICAL** | Safety alerts, health incidents | Patient + Authorized alert receivers + Admin |
| `caregiver_notes` | **CRITICAL** | Clinical notes, observations | Note creator + Authorized care team + Admin |
| `care_relationships` | **MEDIUM** | Care network structure | Relationship parties + Admin |
| `activity_log` | **MEDIUM** | User actions (may contain PHI in metadata) | User + Admin |
| `waitlist_signups` | **LOW** | Pre-registration information | Admin only |

### HIPAA Requirements Addressed

- **Privacy Rule**: Users can only access PHI they are authorized to view
- **Security Rule**: Technical safeguards through RLS policies
- **Minimum Necessary**: Access limited to what's needed for care/job function
- **Access Control**: Unique user identification and access authorization
- **Audit Controls**: Activity logging for PHI access
- **Integrity Controls**: Policies prevent unauthorized modification
- **Transmission Security**: Combined with application-layer encryption

### Compliance Notes

1. **Break-the-Glass Access**: Admins have elevated access for emergency situations
2. **Audit Trail**: All database operations are logged by Supabase
3. **Right to Access**: Patients can export their own data (application feature)
4. **Data Minimization**: RLS prevents over-collection of data
5. **Access Revocation**: Deactivating care relationships immediately revokes access

---

## Helper Functions

### `public.is_admin(user_id UUID)`

**Purpose**: Check if a user has admin role

**Returns**: `BOOLEAN`

**Usage in Policies**: Grants admins elevated access to all tables

**Example**:
```sql
SELECT public.is_admin('550e8400-e29b-41d4-a716-446655440000');
```

**Security**: `SECURITY DEFINER STABLE` - runs with function creator's privileges, cached within transaction

---

### `public.has_active_care_relationship(caregiver_user_id UUID, patient_user_id UUID)`

**Purpose**: Check if caregiver has an active care relationship with patient

**Returns**: `BOOLEAN`

**Usage in Policies**: Determines if caregiver can access patient data

**Conditions Checked**:
- Caregiver ID matches
- Patient ID matches
- Relationship status = 'active'

**Example**:
```sql
SELECT public.has_active_care_relationship(
  '550e8400-e29b-41d4-a716-446655440000',  -- caregiver
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8'   -- patient
);
```

---

### `public.can_view_patient_health_data(caregiver_user_id UUID, patient_user_id UUID)`

**Purpose**: Check if caregiver has permission to view patient's health data

**Returns**: `BOOLEAN`

**Usage in Policies**: Controls access to check_ins and detailed health information

**Conditions Checked**:
- Active care relationship exists
- `can_view_health_data = true` in care_relationship

**Example**:
```sql
SELECT public.can_view_patient_health_data(
  '550e8400-e29b-41d4-a716-446655440000',  -- caregiver
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8'   -- patient
);
```

---

### `public.can_receive_patient_alerts(caregiver_user_id UUID, patient_user_id UUID)`

**Purpose**: Check if caregiver has permission to receive patient alerts

**Returns**: `BOOLEAN`

**Usage in Policies**: Controls access to alerts table

**Conditions Checked**:
- Active care relationship exists
- `can_receive_alerts = true` in care_relationship

**Example**:
```sql
SELECT public.can_receive_patient_alerts(
  '550e8400-e29b-41d4-a716-446655440000',  -- caregiver
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8'   -- patient
);
```

---

### `public.can_modify_patient_settings(caregiver_user_id UUID, patient_user_id UUID)`

**Purpose**: Check if caregiver has permission to modify patient settings

**Returns**: `BOOLEAN`

**Usage in Policies**: Future use for settings management

**Conditions Checked**:
- Active care relationship exists
- `can_modify_settings = true` in care_relationship

---

## Table-by-Table Policy Documentation

### 1. profiles

**PHI Level**: HIGH (Name, DOB, contact information)

#### Policies

| Policy Name | Operation | Applies To | Logic |
|-------------|-----------|------------|-------|
| `profiles_select_own_or_admin` | SELECT | authenticated | User views own profile OR admin views any |
| `profiles_insert_own` | INSERT | authenticated | User can only create profile with their own user_id |
| `profiles_update_own_or_admin` | UPDATE | authenticated | User updates own profile (cannot change role) OR admin updates any |
| `profiles_delete_admin_only` | DELETE | authenticated | Only admins can delete profiles |

#### Rationale

- **Self-Service**: Users manage their own profile information
- **Privacy**: Users cannot view other users' personal information
- **Security**: Role changes require admin privileges (prevents privilege escalation)
- **Data Retention**: Deletion requires admin approval

#### Examples

```sql
-- ✓ ALLOWED: User views own profile
SELECT * FROM profiles WHERE id = auth.uid();

-- ✗ DENIED: User views another user's profile
SELECT * FROM profiles WHERE id = 'other-user-id';

-- ✓ ALLOWED: User updates own name
UPDATE profiles SET full_name = 'New Name' WHERE id = auth.uid();

-- ✗ DENIED: User tries to make themselves admin
UPDATE profiles SET role = 'admin' WHERE id = auth.uid();

-- ✓ ALLOWED: Admin updates any profile
UPDATE profiles SET role = 'admin' WHERE id = 'other-user-id';
-- (when authenticated as admin)
```

---

### 2. care_relationships

**PHI Level**: MEDIUM (Care network structure)

#### Policies

| Policy Name | Operation | Applies To | Logic |
|-------------|-----------|------------|-------|
| `care_relationships_select_involved_or_admin` | SELECT | authenticated | View if user is patient OR caregiver OR admin |
| `care_relationships_insert_patient_or_admin` | INSERT | authenticated | Only patient can create (invite caregivers) OR admin |
| `care_relationships_update_involved_or_admin` | UPDATE | authenticated | Patient modifies permissions, caregiver accepts, admin all |
| `care_relationships_delete_patient_or_admin` | DELETE | authenticated | Only patient (relationship owner) OR admin |

#### Rationale

- **Patient Control**: Patients control who has access to their data
- **Consent Model**: Caregivers must be invited by patient
- **Acceptance Flow**: Caregivers can accept/decline invitations
- **Privacy**: Only parties in relationship can see it

#### Care Relationship Permissions

| Permission | Description | Grants Access To |
|------------|-------------|------------------|
| `can_view_health_data` | View detailed health information | check_ins, detailed summaries |
| `can_receive_alerts` | Receive and manage safety alerts | alerts table |
| `can_modify_settings` | Modify patient preferences | (future use) |

#### Examples

```sql
-- ✓ ALLOWED: Patient creates care relationship
INSERT INTO care_relationships (patient_id, caregiver_id, relationship_type)
VALUES (auth.uid(), 'caregiver-id', 'primary_caregiver');

-- ✗ DENIED: Caregiver tries to add themselves to patient
INSERT INTO care_relationships (patient_id, caregiver_id, relationship_type)
VALUES ('patient-id', auth.uid(), 'primary_caregiver');

-- ✓ ALLOWED: Caregiver accepts invitation
UPDATE care_relationships
SET status = 'active', accepted_at = NOW()
WHERE caregiver_id = auth.uid() AND status = 'pending';

-- ✓ ALLOWED: Patient modifies permissions
UPDATE care_relationships
SET can_view_health_data = true, can_receive_alerts = true
WHERE patient_id = auth.uid();

-- ✓ ALLOWED: Patient terminates relationship
DELETE FROM care_relationships
WHERE patient_id = auth.uid() AND caregiver_id = 'caregiver-id';
```

---

### 3. check_ins

**PHI Level**: CRITICAL (Health conversations, sentiment, safety concerns)

#### Policies

| Policy Name | Operation | Applies To | Logic |
|-------------|-----------|------------|-------|
| `check_ins_select_patient_caregiver_admin` | SELECT | authenticated | Patient OR authorized caregiver OR admin |
| `check_ins_insert_patient_only` | INSERT | authenticated | Only patient OR admin (system creates via service role) |
| `check_ins_update_patient_or_admin` | UPDATE | authenticated | Only patient OR admin |
| `check_ins_delete_patient_or_admin` | DELETE | authenticated | Only patient OR admin |

#### Rationale

- **High Sensitivity**: Contains detailed health conversations
- **Read-Only for Caregivers**: Caregivers can view but not modify (data integrity)
- **Permission-Based**: Only caregivers with `can_view_health_data=true` can access
- **Patient Control**: Patients can modify/delete their own check-ins

#### Authorization Check

Access requires one of:
1. `auth.uid() = patient_id` (patient viewing own)
2. `can_view_patient_health_data(auth.uid(), patient_id) = true` (authorized caregiver)
3. `is_admin(auth.uid()) = true` (admin)

#### Examples

```sql
-- ✓ ALLOWED: Patient views own check-ins
SELECT * FROM check_ins WHERE patient_id = auth.uid();

-- ✓ ALLOWED: Authorized caregiver views patient check-ins
SELECT * FROM check_ins WHERE patient_id = 'patient-id';
-- (when caregiver has active relationship with can_view_health_data=true)

-- ✗ DENIED: Unauthorized caregiver views check-ins
SELECT * FROM check_ins WHERE patient_id = 'patient-id';
-- (when can_view_health_data=false)

-- ✗ DENIED: Caregiver tries to modify check-in
UPDATE check_ins SET messages = '[...]' WHERE patient_id = 'patient-id';

-- ✓ ALLOWED: Patient updates own check-in
UPDATE check_ins SET mood_detected = 'happy' WHERE patient_id = auth.uid();
```

---

### 4. daily_summaries

**PHI Level**: CRITICAL (Aggregated health metrics, medication compliance)

#### Policies

| Policy Name | Operation | Applies To | Logic |
|-------------|-----------|------------|-------|
| `daily_summaries_select_patient_caregiver_admin` | SELECT | authenticated | Patient OR active caregiver OR admin |
| `daily_summaries_insert_admin_only` | INSERT | authenticated | Admin only (system via service role) |
| `daily_summaries_update_admin_only` | UPDATE | authenticated | Admin only (system via triggers) |
| `daily_summaries_delete_admin_only` | DELETE | authenticated | Admin only |

#### Rationale

- **System-Generated**: Created automatically via triggers from check_ins
- **Wider Access**: Active caregivers can view (doesn't require can_view_health_data)
- **Immutable for Users**: Only system/admins modify to maintain data integrity
- **Care Coordination**: Summary data helps care team coordinate

#### Authorization Check

Access requires one of:
1. `auth.uid() = patient_id` (patient viewing own)
2. `has_active_care_relationship(auth.uid(), patient_id) = true` (active caregiver)
3. `is_admin(auth.uid()) = true` (admin)

#### Examples

```sql
-- ✓ ALLOWED: Patient views own summaries
SELECT * FROM daily_summaries WHERE patient_id = auth.uid();

-- ✓ ALLOWED: Active caregiver views patient summaries
SELECT * FROM daily_summaries WHERE patient_id = 'patient-id';
-- (when active care relationship exists)

-- ✗ DENIED: Inactive caregiver views summaries
SELECT * FROM daily_summaries WHERE patient_id = 'patient-id';
-- (when relationship status = 'inactive')

-- ✗ DENIED: Regular user inserts summary
INSERT INTO daily_summaries (patient_id, summary_date) VALUES (...);
-- (only system/admin can insert)
```

---

### 5. alerts

**PHI Level**: CRITICAL (Safety alerts, health incidents)

#### Policies

| Policy Name | Operation | Applies To | Logic |
|-------------|-----------|------------|-------|
| `alerts_select_patient_caregiver_admin` | SELECT | authenticated | Patient OR authorized alert receiver OR admin |
| `alerts_insert_admin_only` | INSERT | authenticated | Admin only (system via service role) |
| `alerts_update_caregiver_or_admin` | UPDATE | authenticated | Authorized alert receiver OR admin |
| `alerts_delete_admin_only` | DELETE | authenticated | Admin only |

#### Rationale

- **Safety Critical**: Patients cannot dismiss their own alerts (safety feature)
- **Caregiver Action**: Caregivers acknowledge and resolve alerts
- **Permission-Based**: Only caregivers with `can_receive_alerts=true` can act
- **Audit Trail**: Alerts should not be deleted (use status changes instead)

#### Authorization Check

**For SELECT**:
1. `auth.uid() = patient_id` (patient viewing own)
2. `can_receive_patient_alerts(auth.uid(), patient_id) = true` (authorized caregiver)
3. `is_admin(auth.uid()) = true` (admin)

**For UPDATE**:
1. `can_receive_patient_alerts(auth.uid(), patient_id) = true` (authorized caregiver)
2. `is_admin(auth.uid()) = true` (admin)

**Note**: Patients can VIEW but not UPDATE their alerts

#### Examples

```sql
-- ✓ ALLOWED: Patient views own alerts
SELECT * FROM alerts WHERE patient_id = auth.uid();

-- ✗ DENIED: Patient tries to dismiss alert
UPDATE alerts SET status = 'resolved' WHERE patient_id = auth.uid();
-- (safety feature: patients cannot dismiss own alerts)

-- ✓ ALLOWED: Authorized caregiver acknowledges alert
UPDATE alerts
SET status = 'acknowledged', acknowledged_by = auth.uid(), acknowledged_at = NOW()
WHERE patient_id = 'patient-id' AND id = 'alert-id';
-- (when can_receive_alerts=true)

-- ✗ DENIED: Unauthorized caregiver views alerts
SELECT * FROM alerts WHERE patient_id = 'patient-id';
-- (when can_receive_alerts=false)
```

---

### 6. caregiver_notes

**PHI Level**: CRITICAL (Clinical notes, care observations)

#### Policies

| Policy Name | Operation | Applies To | Logic |
|-------------|-----------|------------|-------|
| `caregiver_notes_select_authorized` | SELECT | authenticated | Note creator OR patient (if shared) OR care team (if shared) OR admin |
| `caregiver_notes_insert_caregiver_only` | INSERT | authenticated | Caregiver with active relationship |
| `caregiver_notes_update_creator_or_admin` | UPDATE | authenticated | Note creator OR admin |
| `caregiver_notes_delete_creator_or_admin` | DELETE | authenticated | Note creator OR admin |

#### Rationale

- **Professional Documentation**: Caregivers document observations and care plans
- **Sharing Control**: Notes can be shared with patient and/or care team
- **Ownership**: Only note creator can modify (except admins)
- **Care Coordination**: Care team can view shared notes

#### Sharing Flags

| Flag | Description | Who Can View |
|------|-------------|--------------|
| `shared_with_patient=true` | Patient can view note | Patient |
| `shared_with_care_team=true` | Other caregivers can view | Active care team members |
| Both false | Private note | Note creator and admin only |

#### Examples

```sql
-- ✓ ALLOWED: Caregiver creates note for their patient
INSERT INTO caregiver_notes (patient_id, caregiver_id, note_text, shared_with_care_team)
VALUES ('patient-id', auth.uid(), 'Patient seems well today', true);
-- (when active care relationship exists)

-- ✗ DENIED: Caregiver creates note for unrelated patient
INSERT INTO caregiver_notes (patient_id, caregiver_id, note_text)
VALUES ('unrelated-patient-id', auth.uid(), 'Note');
-- (no active care relationship)

-- ✓ ALLOWED: Patient views note shared with them
SELECT * FROM caregiver_notes
WHERE patient_id = auth.uid() AND shared_with_patient = true;

-- ✗ DENIED: Patient views private caregiver note
SELECT * FROM caregiver_notes
WHERE patient_id = auth.uid() AND shared_with_patient = false;

-- ✓ ALLOWED: Care team member views shared note
SELECT * FROM caregiver_notes
WHERE patient_id = 'patient-id' AND shared_with_care_team = true;
-- (when active care relationship exists)

-- ✓ ALLOWED: Note creator updates own note
UPDATE caregiver_notes SET note_text = 'Updated' WHERE caregiver_id = auth.uid();

-- ✗ DENIED: Caregiver updates another caregiver's note
UPDATE caregiver_notes SET note_text = 'Updated' WHERE caregiver_id = 'other-caregiver';
```

---

### 7. activity_log

**PHI Level**: MEDIUM (Audit trail, may contain PHI in metadata)

#### Policies

| Policy Name | Operation | Applies To | Logic |
|-------------|-----------|------------|-------|
| `activity_log_select_own_or_admin` | SELECT | authenticated | User views own OR admin views all |
| `activity_log_insert_own_or_system` | INSERT | authenticated | User logs own activity (system via service role) |
| `activity_log_update_admin_only` | UPDATE | authenticated | Admin only (for corrections) |
| `activity_log_delete_admin_only` | DELETE | authenticated | Admin only (for retention compliance) |

#### Rationale

- **Audit Trail**: HIPAA requires logging of PHI access
- **User Transparency**: Users can view their own activity history
- **Immutability**: Activity logs should not be modified (audit integrity)
- **Admin Oversight**: Admins can view all activity for compliance audits

#### Examples

```sql
-- ✓ ALLOWED: User views own activity
SELECT * FROM activity_log WHERE user_id = auth.uid();

-- ✗ DENIED: User views another user's activity
SELECT * FROM activity_log WHERE user_id = 'other-user-id';

-- ✓ ALLOWED: Admin views all activity
SELECT * FROM activity_log;
-- (when authenticated as admin)

-- ✓ ALLOWED: System logs user activity
INSERT INTO activity_log (user_id, activity_type, activity_description)
VALUES (auth.uid(), 'login', 'User logged in');
```

---

### 8. waitlist_signups

**PHI Level**: LOW (Pre-registration data)

#### Policies

| Policy Name | Operation | Applies To | Logic |
|-------------|-----------|------------|-------|
| `waitlist_signups_select_admin_only` | SELECT | authenticated | Admin only |
| `waitlist_signups_insert_public` | INSERT | anon, authenticated | Anyone can sign up |
| `waitlist_signups_update_admin_only` | UPDATE | authenticated | Admin only |
| `waitlist_signups_delete_admin_only` | DELETE | authenticated | Admin only |

#### Rationale

- **Public Access**: Marketing/signup page allows anonymous submissions
- **Privacy**: Only admins can view signup list
- **GDPR Compliance**: Users cannot view others' signups

#### Examples

```sql
-- ✓ ALLOWED: Anonymous user signs up
INSERT INTO waitlist_signups (name, email, role, message)
VALUES ('John Doe', 'john@example.com', 'caregiver', 'Interested in beta');
-- (no authentication required)

-- ✗ DENIED: Regular user views waitlist
SELECT * FROM waitlist_signups;

-- ✓ ALLOWED: Admin views all signups
SELECT * FROM waitlist_signups;
-- (when authenticated as admin)
```

---

## Access Control Matrix

### Complete Permission Matrix

| Table | Own Data (Patient) | Own Data (Caregiver) | Related Patient Data | Admin | Anonymous |
|-------|-------------------|----------------------|----------------------|-------|-----------|
| **profiles** | R/U | R/U | - | R/U/D | - |
| **care_relationships** | R/U/D | R/U | - | R/U/D | - |
| **check_ins** | R/U/D | - | R (if can_view_health_data) | R/U/D | - |
| **daily_summaries** | R | - | R (if active relationship) | R/U/D | - |
| **alerts** | R | - | R/U (if can_receive_alerts) | R/U/D | - |
| **caregiver_notes** | R (if shared) | R/U/D | R (if shared with care team) | R/U/D | - |
| **activity_log** | R | R | - | R/U/D | - |
| **waitlist_signups** | - | - | - | R/U/D | C |

**Legend**: R=Read, C=Create, U=Update, D=Delete, -=No Access

### Permission Inheritance

```
Admin Role
  ├─ Full access to all tables
  ├─ Can modify any record
  ├─ Can view all audit logs
  └─ Emergency access capabilities

Patient Role
  ├─ Full access to own data
  ├─ Control care relationships
  ├─ View shared caregiver notes
  └─ Cannot modify own alerts (safety)

Caregiver Role (with active relationship)
  ├─ View patient data (based on permissions)
  ├─ Manage own notes
  ├─ Acknowledge alerts (if authorized)
  └─ Cannot modify patient's check-ins

Family Member Role
  └─ Same as Caregiver (needs care relationship)
```

---

## Common Scenarios

### Scenario 1: Onboarding New Patient-Caregiver Pair

**Flow**:
1. Patient (senior) creates account → `profiles` insert allowed
2. Caregiver creates account → `profiles` insert allowed
3. Patient creates care relationship → `care_relationships` insert allowed
4. Caregiver receives invitation email (application layer)
5. Caregiver accepts → `care_relationships` update allowed
6. System sets `status='active'` → Access granted

**RLS Behavior**:
- Before acceptance: Caregiver can see invitation but not patient data
- After acceptance: Caregiver can view patient data per permissions
- Patient can modify permissions at any time

### Scenario 2: Daily Check-In with Alert

**Flow**:
1. Patient has check-in conversation → `check_ins` insert allowed
2. AI detects safety concern → triggers alert
3. System creates alert → `alerts` insert (service role bypasses RLS)
4. System notifies caregivers with `can_receive_alerts=true`
5. Caregiver views alert → `alerts` select allowed (if authorized)
6. Caregiver acknowledges → `alerts` update allowed (if authorized)

**RLS Behavior**:
- Patient can view alert but cannot dismiss
- Only authorized caregivers receive notification
- Unauthorized caregivers see nothing
- All actions logged in `activity_log`

### Scenario 3: Care Team Coordination

**Flow**:
1. Primary caregiver creates note → `caregiver_notes` insert allowed
2. Note set to `shared_with_care_team=true`
3. Secondary caregiver views note → `caregiver_notes` select allowed
4. Secondary caregiver creates response note → `caregiver_notes` insert allowed
5. Patient optionally views if `shared_with_patient=true`

**RLS Behavior**:
- Each caregiver can only create notes for their patients
- Shared notes visible to entire active care team
- Private notes only visible to creator and admin
- Patient sees shared notes in dashboard

### Scenario 4: Terminating Care Relationship

**Flow**:
1. Patient decides to remove caregiver
2. Patient updates relationship → `care_relationships` update allowed
3. System sets `status='inactive'`
4. Caregiver immediately loses data access

**RLS Behavior**:
- Access revocation is immediate (next query fails)
- Historical data remains intact (audit trail)
- Caregiver can still view relationship record (for their records)
- New check-ins/alerts not visible to ex-caregiver

### Scenario 5: Admin Investigation

**Flow**:
1. Admin receives support request
2. Admin searches for user → `profiles` select allowed
3. Admin views user's activity → `activity_log` select allowed
4. Admin reviews care relationships → `care_relationships` select allowed
5. Admin resolves issue, documents in internal system

**RLS Behavior**:
- Admin has read access to all tables
- Admin can modify records if necessary
- All admin actions logged in `activity_log`
- Admin cannot bypass authentication (must be logged in)

---

## Testing & Verification

### Quick Verification Checklist

Run these queries to verify RLS is properly configured:

```sql
-- 1. Verify RLS enabled on all tables
SELECT tablename, CASE WHEN rowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED' END as rls_status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'care_relationships', 'check_ins', 'daily_summaries',
                    'alerts', 'caregiver_notes', 'activity_log', 'waitlist_signups');

-- 2. Count policies per table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 3. Verify helper functions exist
SELECT proname, prokind FROM pg_proc
WHERE proname IN ('is_admin', 'has_active_care_relationship',
                  'can_view_patient_health_data', 'can_receive_patient_alerts',
                  'can_modify_patient_settings');

-- 4. Test a simple policy (as authenticated user)
SELECT * FROM profiles WHERE id = auth.uid(); -- Should return 1 row (your profile)
SELECT * FROM profiles; -- Should return only your profile (if not admin)
```

### Comprehensive Test Suite

See file: `20251012000002_rls_policy_tests.sql`

This test suite includes:
- Unit tests for each policy
- Integration tests for common scenarios
- Security tests for unauthorized access attempts
- Performance tests for query optimization
- Manual test scenarios for QA

### Testing with Supabase Client

```javascript
// Create two test users
const { data: patient } = await supabase.auth.signUp({
  email: 'patient@test.com',
  password: 'testpass123'
});

const { data: caregiver } = await supabase.auth.signUp({
  email: 'caregiver@test.com',
  password: 'testpass123'
});

// Test as patient: Create care relationship
await supabase
  .from('care_relationships')
  .insert({
    patient_id: patient.user.id,
    caregiver_id: caregiver.user.id,
    relationship_type: 'primary_caregiver',
    can_view_health_data: true
  }); // Should succeed

// Test as caregiver: Try to view check-ins (before acceptance)
await supabase
  .from('check_ins')
  .select('*')
  .eq('patient_id', patient.user.id); // Should return empty (relationship not active)

// Test as caregiver: Accept relationship
await supabase
  .from('care_relationships')
  .update({ status: 'active', accepted_at: new Date().toISOString() })
  .eq('caregiver_id', caregiver.user.id)
  .eq('patient_id', patient.user.id); // Should succeed

// Test as caregiver: View check-ins (after acceptance)
await supabase
  .from('check_ins')
  .select('*')
  .eq('patient_id', patient.user.id); // Should succeed now
```

---

## Troubleshooting

### Common Issues

#### Issue: "new row violates row-level security policy"

**Symptom**: INSERT fails with RLS policy violation

**Cause**: User trying to insert row they don't have permission for

**Solutions**:
1. Check user is authenticated: `SELECT auth.uid()` should return UUID
2. Verify user is inserting with their own user_id (for profiles, check_ins)
3. Verify care relationship exists and is active (for caregiver_notes)
4. Check if operation should use service role instead (for system-generated data)

**Example**:
```sql
-- ✗ FAILS: Trying to create check-in for another user
INSERT INTO check_ins (patient_id, ...) VALUES ('other-user-id', ...);

-- ✓ WORKS: Create check-in for self
INSERT INTO check_ins (patient_id, ...) VALUES (auth.uid(), ...);
```

#### Issue: "SELECT returns no rows" (but data exists)

**Symptom**: Query returns empty result set, but admin can see the data

**Cause**: RLS policies filtering out rows user doesn't have permission to view

**Solutions**:
1. Verify user has proper care relationship
2. Check relationship status is 'active'
3. Verify permissions flags (can_view_health_data, can_receive_alerts)
4. Check if user is trying to access another user's data

**Debugging**:
```sql
-- Check if care relationship exists
SELECT * FROM care_relationships
WHERE (patient_id = auth.uid() OR caregiver_id = auth.uid());

-- Check relationship status and permissions
SELECT
  patient_id,
  caregiver_id,
  status,
  can_view_health_data,
  can_receive_alerts
FROM care_relationships
WHERE caregiver_id = auth.uid();

-- Test helper functions
SELECT public.has_active_care_relationship(auth.uid(), 'patient-id');
SELECT public.can_view_patient_health_data(auth.uid(), 'patient-id');
```

#### Issue: "UPDATE/DELETE returns 0 rows affected"

**Symptom**: Update/delete statement runs but doesn't modify anything

**Cause**: RLS policies preventing modification of rows

**Solutions**:
1. Verify user owns the row they're trying to modify
2. Check if row exists and user has permission to see it
3. Verify user has UPDATE/DELETE permission (not just SELECT)

**Example**:
```sql
-- Check if you can see the row
SELECT * FROM caregiver_notes WHERE id = 'note-id';
-- If returns row, check caregiver_id

-- Verify you own the note
SELECT * FROM caregiver_notes
WHERE id = 'note-id' AND caregiver_id = auth.uid();
-- If returns empty, you don't own it
```

#### Issue: "Function does not exist" for RLS helper functions

**Symptom**: Policy references function that database can't find

**Cause**: Helper functions not created or wrong schema

**Solutions**:
1. Verify functions exist: `\df public.is_admin`
2. Run migration: `20251012000001_comprehensive_rls_policies.sql`
3. Check function grants: `GRANT EXECUTE ON FUNCTION ... TO authenticated`

#### Issue: Poor query performance with RLS

**Symptom**: Queries are slow after enabling RLS

**Cause**: RLS policies require joins/subqueries that need indexing

**Solutions**:
1. Verify RLS-specific indexes exist
2. Use EXPLAIN ANALYZE to identify bottlenecks
3. Consider materialized views for complex permission checks

**Indexes for RLS performance**:
```sql
-- Already included in migration, verify they exist
CREATE INDEX idx_profiles_role_id ON public.profiles(role, id);
CREATE INDEX idx_care_relationships_caregiver_status
  ON public.care_relationships(caregiver_id, status) WHERE status = 'active';
CREATE INDEX idx_care_relationships_patient_status
  ON public.care_relationships(patient_id, status) WHERE status = 'active';
```

### Getting Help

If you encounter issues not covered here:

1. **Check Supabase Logs**: Database logs show RLS policy violations
2. **Enable Debug Logging**: Set `log_statement = 'all'` in Postgres (test only!)
3. **Test with Service Role**: Bypass RLS to verify data exists
4. **Review Audit Logs**: Check `activity_log` for clues
5. **Contact Support**: Include user_id, table name, operation, and error message

---

## Emergency Procedures

### Emergency Admin Access

If admins are locked out or RLS needs to be temporarily disabled:

**⚠️ WARNING: Only use in true emergencies. Document all actions.**

#### Option 1: Use Service Role Key (Preferred)

```javascript
// Service role bypasses RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Now can access all data
const { data } = await supabase.from('profiles').select('*');
```

#### Option 2: Temporarily Disable RLS (Last Resort)

```sql
-- ⚠️ EMERGENCY ONLY - Disables all access control
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Perform emergency operation
-- ...

-- ⚠️ IMMEDIATELY RE-ENABLE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

**Required Documentation**:
- Date/time of RLS bypass
- User who performed bypass
- Reason for bypass
- Data accessed
- When RLS was re-enabled
- Notification to security team

### Data Breach Response

If unauthorized data access is suspected:

1. **Immediate Actions**:
   - Query `activity_log` for suspicious access patterns
   - Identify affected users/data
   - Revoke suspicious user sessions
   - Reset compromised credentials

2. **Investigation**:
   ```sql
   -- Find all access by user
   SELECT * FROM activity_log
   WHERE user_id = 'suspicious-user-id'
   ORDER BY created_at DESC;

   -- Find PHI access
   SELECT * FROM activity_log
   WHERE activity_type = 'phi_access'
   AND user_id = 'suspicious-user-id';

   -- Find all data modifications
   SELECT * FROM activity_log
   WHERE activity_type IN ('profile_update', 'note_created', 'settings_changed')
   AND user_id = 'suspicious-user-id';
   ```

3. **Remediation**:
   - Deactivate compromised care relationships
   - Notify affected patients (HIPAA requirement)
   - Document incident for compliance
   - Review and strengthen RLS policies if needed

### Disaster Recovery

To verify RLS after database restore:

```sql
-- 1. Verify all tables have RLS enabled
SELECT tablename, relrowsecurity FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public';

-- 2. Verify all policies exist
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename;

-- 3. Verify helper functions exist
SELECT proname FROM pg_proc
WHERE proname LIKE '%admin%' OR proname LIKE '%care%';

-- 4. Test basic policy
SELECT * FROM profiles WHERE id = auth.uid();
```

### Roll back RLS Policies

If RLS policies need to be rolled back:

```sql
-- Drop all RLS policies
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin_only" ON public.profiles;
-- ... repeat for all policies ...

-- Drop helper functions
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.has_active_care_relationship(UUID, UUID);
DROP FUNCTION IF EXISTS public.can_view_patient_health_data(UUID, UUID);
DROP FUNCTION IF EXISTS public.can_receive_patient_alerts(UUID, UUID);
DROP FUNCTION IF EXISTS public.can_modify_patient_settings(UUID, UUID);

-- Optionally disable RLS (not recommended for production)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
-- ... repeat for all tables ...
```

**Warning**: Rolling back RLS removes all access control. Only do this in emergencies or during development. Production databases should ALWAYS have RLS enabled.

---

## Maintenance and Updates

### Regular Maintenance Tasks

**Weekly**:
- Review `activity_log` for unusual access patterns
- Verify no orphaned care relationships
- Check for accounts with excessive admin privileges

**Monthly**:
- Audit admin account list
- Review and document any emergency RLS bypasses
- Performance testing of RLS policies
- Review and update this documentation

**Quarterly**:
- HIPAA compliance audit
- Security review of RLS policies
- Penetration testing (include RLS bypass attempts)
- Disaster recovery drill

### Updating RLS Policies

When modifying RLS policies:

1. **Test in Development**: Always test changes in non-production environment
2. **Document Changes**: Update this documentation
3. **Create Migration**: Write reversible SQL migration
4. **Backup Database**: Before applying to production
5. **Deploy During Maintenance Window**: Minimize user impact
6. **Verify Immediately**: Run test suite after deployment
7. **Monitor**: Watch for RLS-related errors in logs

Example migration format:
```sql
-- Migration: 20251012000003_update_rls_policy.sql

-- Drop existing policy
DROP POLICY IF EXISTS "old_policy_name" ON public.table_name;

-- Create new policy
CREATE POLICY "new_policy_name"
  ON public.table_name
  FOR SELECT
  TO authenticated
  USING (...);

-- Test the policy
-- (include test queries)
```

---

## Compliance Documentation

### HIPAA Audit Evidence

This RLS implementation provides evidence for the following HIPAA requirements:

**Administrative Safeguards** (§164.308):
- Security Management Process: RLS policies enforce access control
- Workforce Security: Role-based access controls implemented
- Access Management: User access authorization and establishment

**Physical Safeguards** (§164.310):
- (Handled at infrastructure level)

**Technical Safeguards** (§164.312):
- Access Control (§164.312(a)(1)): Unique user identification, emergency access, automatic logoff, encryption
- Audit Controls (§164.312(b)): activity_log table
- Integrity (§164.312(c)(1)): Policies prevent unauthorized data modification
- Transmission Security (§164.312(e)(1)): (Handled at application/network level)

### Audit Trail

All PHI access can be audited via:
- Supabase built-in logging
- `activity_log` table
- Database query logs (if enabled)

### Data Subject Rights (GDPR)

RLS policies support:
- **Right to Access**: Users can query their own data
- **Right to Erasure**: Deletion policies allow data removal
- **Right to Rectification**: Update policies allow data correction
- **Right to Data Portability**: Users can export their own data

---

## Appendix

### Policy Naming Convention

All policies follow this naming pattern:
```
{table_name}_{operation}_{condition}
```

Examples:
- `profiles_select_own_or_admin`: SELECT on profiles for own records or admin
- `check_ins_insert_patient_only`: INSERT on check_ins for patient only
- `alerts_update_caregiver_or_admin`: UPDATE on alerts for caregiver or admin

### Complete Policy List

Total: 32 RLS policies across 8 tables

```
profiles (4 policies)
├─ profiles_select_own_or_admin
├─ profiles_insert_own
├─ profiles_update_own_or_admin
└─ profiles_delete_admin_only

care_relationships (4 policies)
├─ care_relationships_select_involved_or_admin
├─ care_relationships_insert_patient_or_admin
├─ care_relationships_update_involved_or_admin
└─ care_relationships_delete_patient_or_admin

check_ins (4 policies)
├─ check_ins_select_patient_caregiver_admin
├─ check_ins_insert_patient_only
├─ check_ins_update_patient_or_admin
└─ check_ins_delete_patient_or_admin

daily_summaries (4 policies)
├─ daily_summaries_select_patient_caregiver_admin
├─ daily_summaries_insert_admin_only
├─ daily_summaries_update_admin_only
└─ daily_summaries_delete_admin_only

alerts (4 policies)
├─ alerts_select_patient_caregiver_admin
├─ alerts_insert_admin_only
├─ alerts_update_caregiver_or_admin
└─ alerts_delete_admin_only

caregiver_notes (4 policies)
├─ caregiver_notes_select_authorized
├─ caregiver_notes_insert_caregiver_only
├─ caregiver_notes_update_creator_or_admin
└─ caregiver_notes_delete_creator_or_admin

activity_log (4 policies)
├─ activity_log_select_own_or_admin
├─ activity_log_insert_own_or_system
├─ activity_log_update_admin_only
└─ activity_log_delete_admin_only

waitlist_signups (4 policies)
├─ waitlist_signups_select_admin_only
├─ waitlist_signups_insert_public
├─ waitlist_signups_update_admin_only
└─ waitlist_signups_delete_admin_only
```

### Performance Benchmarks

Expected query performance with RLS enabled (on typical hardware, ~1000 users):

| Query Type | Without RLS | With RLS | Overhead |
|------------|-------------|----------|----------|
| SELECT own profile | 0.5ms | 0.8ms | +60% |
| SELECT own check_ins | 2ms | 3ms | +50% |
| SELECT with care relationship | 3ms | 5ms | +66% |
| Complex JOIN with RLS | 10ms | 15ms | +50% |

**Note**: Performance scales well due to proper indexing. Monitor slow query log for outliers.

### Glossary

- **RLS**: Row-Level Security - Postgres feature for fine-grained access control
- **PHI**: Protected Health Information - health data protected by HIPAA
- **PII**: Personally Identifiable Information - data that identifies individuals
- **HIPAA**: Health Insurance Portability and Accountability Act
- **GDPR**: General Data Protection Regulation
- **Service Role**: Supabase API key that bypasses RLS (for system operations)
- **Authenticated Role**: Standard user role subject to RLS policies
- **Anon Role**: Unauthenticated user role (very limited access)

---

## Document Version Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-12 | Database Administrator | Initial comprehensive documentation |

---

## Contact Information

For questions about RLS policies:
- **Development Team**: development@paraconnect.com
- **Security Team**: security@paraconnect.com
- **HIPAA Compliance Officer**: compliance@paraconnect.com
- **Emergency**: emergency-access@paraconnect.com

---

**END OF DOCUMENTATION**

This documentation should be reviewed quarterly and updated whenever RLS policies change.
