-- =====================================================
-- DBA MANUAL USER CREATION GUIDE
-- =====================================================
-- For Data Engineers/DBAs who want to create users via SQL
--
-- IMPORTANT: Password Management with Supabase
-- - Passwords are stored in auth.users.encrypted_password (bcrypt)
-- - You CANNOT directly INSERT into auth.users via SQL Editor
-- - Use one of these methods instead:
--   1. Supabase Dashboard: Authentication > Users > "Add User"
--   2. Supabase CLI: supabase auth users create
--   3. Auth API endpoint
--   4. Through the app signup flow
--
-- After user is created in auth.users, the trigger will auto-create
-- their profile in public.profiles
-- =====================================================

-- =====================================================
-- METHOD 1: Recommended - Use Supabase Dashboard
-- =====================================================
-- 1. Go to: https://app.supabase.com
-- 2. Select project: xoygyimwkmepwjqmnfxh
-- 3. Navigate: Authentication > Users
-- 4. Click: "Add User" or "Invite User"
-- 5. Fill in:
--    - Email: user@example.com
--    - Password: (set a password)
--    - Auto Confirm: YES (to skip email verification)
-- 6. User Metadata (optional JSON):
--    {
--      "full_name": "John Doe",
--      "display_name": "John",
--      "role": "admin",
--      "phone_number": "+14155551234"
--    }
--
-- The trigger will automatically create the profile!

-- =====================================================
-- METHOD 2: Check if User Already Exists in auth.users
-- =====================================================
-- View users in auth.users (you need service_role access)
SELECT
  id,
  email,
  created_at,
  confirmed_at,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC;

-- =====================================================
-- METHOD 3: If Profile is Missing for Existing User
-- =====================================================
-- If a user exists in auth.users but NOT in public.profiles,
-- manually create their profile:

-- First, find the user's UUID from auth.users
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then create the profile manually (replace values)
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  display_name,
  role,
  phone_number,
  created_at,
  updated_at,
  last_active_at
) VALUES (
  'USER_UUID_FROM_AUTH_USERS', -- Copy UUID from above query
  'your-email@example.com',
  'Your Full Name',
  'Display Name',
  'admin', -- or 'caregiver', 'senior', 'family_member'
  '+14155551234',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- =====================================================
-- METHOD 4: Promote Existing User to Admin
-- =====================================================
-- Find user
SELECT id, email, full_name, role FROM public.profiles
WHERE email = 'your-email@example.com';

-- Promote to admin
UPDATE public.profiles
SET
  role = 'admin',
  updated_at = NOW()
WHERE email = 'your-email@example.com';

-- Verify
SELECT id, email, full_name, role FROM public.profiles
WHERE role = 'admin';

-- =====================================================
-- METHOD 5: Password Reset (Admin Perspective)
-- =====================================================
-- As a DBA, you CANNOT directly reset passwords in the database
-- Use one of these methods:
--
-- Option A - Supabase Dashboard:
-- 1. Go to: Authentication > Users
-- 2. Find the user
-- 3. Click "..." menu > "Reset Password"
-- 4. Send reset email OR set new password directly
--
-- Option B - SQL Editor (send reset email):
-- NOTE: This requires the auth.send_password_reset_email function
-- which may not be available in SQL Editor. Use Dashboard instead.
--
-- Option C - Temporarily disable email confirmation:
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email = 'user@example.com';
--
-- Then user can login and change password in the app

-- =====================================================
-- METHOD 6: Create Multiple Test Users
-- =====================================================
-- You must create users in auth.users first (via Dashboard)
-- Then manually create their profiles:

-- Admin user
INSERT INTO public.profiles (id, email, full_name, role) VALUES
('YOUR_UUID_1', 'admin@parakind.com', 'Admin User', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Caregiver user
INSERT INTO public.profiles (id, email, full_name, role) VALUES
('YOUR_UUID_2', 'caregiver@parakind.com', 'Jane Caregiver', 'caregiver')
ON CONFLICT (id) DO NOTHING;

-- Senior user
INSERT INTO public.profiles (id, email, full_name, role) VALUES
('YOUR_UUID_3', 'senior@parakind.com', 'Bob Senior', 'senior')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DIAGNOSTIC QUERIES
-- =====================================================

-- Check for users in auth.users but NOT in profiles
SELECT
  u.id,
  u.email,
  u.created_at,
  CASE WHEN p.id IS NULL THEN 'MISSING PROFILE' ELSE 'Has Profile' END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- Check for orphaned profiles (profiles without auth.users entry)
-- These should NOT exist in a healthy system
SELECT
  p.id,
  p.email,
  p.role,
  CASE WHEN u.id IS NULL THEN 'ORPHANED' ELSE 'Valid' END as status
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- View all current admins
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  u.email_confirmed_at,
  u.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;

-- =====================================================
-- QUICK REFERENCE: User Role Values
-- =====================================================
-- Valid values for public.profiles.role column:
-- 'admin'         - Full system access
-- 'caregiver'     - Professional caregiver
-- 'family_member' - Family caregiver
-- 'senior'        - Senior/patient user
--
-- NOTE: role is TEXT type, not ENUM
-- CHECK constraint ensures only these 4 values are allowed

-- =====================================================
-- SECURITY NOTES FOR DBAs
-- =====================================================
-- 1. NEVER store plaintext passwords anywhere
-- 2. auth.users.encrypted_password is bcrypt hashed
-- 3. Supabase Auth handles all password operations
-- 4. Row Level Security (RLS) is ENABLED on all tables
-- 5. Direct SQL modifications bypass RLS - use service_role
-- 6. Always use parameterized queries in application code
-- 7. public.profiles.role determines app-level permissions
-- 8. auth.users metadata is JSON - can store extra fields

-- =====================================================
-- END OF DBA GUIDE
-- =====================================================
