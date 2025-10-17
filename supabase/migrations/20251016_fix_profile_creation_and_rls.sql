-- =====================================================
-- FIX PROFILE CREATION AND RLS POLICIES
-- =====================================================
-- This migration fixes:
-- 1. Profile creation trigger for new users
-- 2. RLS policies to allow users to read their own profile immediately
-- 3. Admin user creation issues

-- =====================================================
-- 1. DROP AND RECREATE PROFILE CREATION TRIGGER
-- =====================================================
-- Ensure profiles are created correctly when users sign up

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create improved function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile for new user
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
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'senior')::text,
    NEW.raw_user_meta_data->>'phone_number',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates a profile entry when a new user signs up. Handles conflicts gracefully.';

-- =====================================================
-- 2. FIX RLS POLICIES FOR PROFILES TABLE
-- =====================================================
-- Ensure users can read their own profile immediately after creation

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin_only" ON public.profiles;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile or admins can view all
-- Also allows service role to bypass (for trigger/functions)
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR auth.role() = 'service_role'
  );

-- Policy: Allow profile creation during signup
-- Service role can insert any profile (for admin operations)
CREATE POLICY "profiles_insert_policy"
  ON public.profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = id
    OR auth.role() = 'service_role'
  );

-- Policy: Users can update their own profile (except role)
-- Admins can update any profile
CREATE POLICY "profiles_update_policy"
  ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    -- Regular users can't change their role
    (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    -- Admins and service role can change anything
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR auth.role() = 'service_role'
  );

-- Policy: Only admins can delete profiles
CREATE POLICY "profiles_delete_policy"
  ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR auth.role() = 'service_role'
  );

-- =====================================================
-- 3. CREATE FUNCTION FOR ADMIN USER CREATION
-- =====================================================
-- Database function that can be called with service role privileges

CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_password text DEFAULT NULL,
  p_full_name text DEFAULT NULL,
  p_role text DEFAULT 'senior',
  p_phone_number text DEFAULT NULL,
  p_date_of_birth date DEFAULT NULL,
  p_emergency_contact_name text DEFAULT NULL,
  p_emergency_contact_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- Validate inputs
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  IF p_role NOT IN ('admin', 'senior', 'caregiver') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  -- Check if caller is an admin (when not called by service role)
  IF auth.role() != 'service_role' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Only admins can create users';
    END IF;
  END IF;

  -- Generate a random password if not provided
  IF p_password IS NULL THEN
    p_password := encode(gen_random_bytes(16), 'hex');
  END IF;

  -- Create the auth user
  -- Note: This requires the function to be called with appropriate privileges
  v_user_id := extensions.uuid_generate_v4();

  -- Insert into auth.users (this would need to be done via Supabase Admin API in production)
  -- For now, we'll just create the profile and return instructions

  -- Create the profile directly
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    display_name,
    role,
    phone_number,
    date_of_birth,
    emergency_contact_name,
    emergency_contact_phone,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    p_email,
    COALESCE(p_full_name, p_email),
    COALESCE(p_full_name, split_part(p_email, '@', 1)),
    p_role,
    p_phone_number,
    p_date_of_birth,
    p_emergency_contact_name,
    p_emergency_contact_phone,
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO NOTHING;

  -- Check if insert was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % already exists', p_email;
  END IF;

  -- Log the action
  INSERT INTO public.activity_log (
    user_id,
    activity_type,
    activity_description,
    activity_metadata
  )
  VALUES (
    auth.uid(),
    'admin_create_user',
    format('Admin created user: %s', p_email),
    jsonb_build_object(
      'created_user_id', v_user_id,
      'created_user_email', p_email,
      'created_user_role', p_role
    )
  );

  -- Return success with instructions
  v_result := jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', p_email,
    'role', p_role,
    'message', 'Profile created. Use Supabase Admin API or Edge Function to create auth user.',
    'temporary_password', p_password
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.admin_create_user IS
  'Creates a user profile. For complete user creation including auth, use Edge Function or Admin API.';

-- Grant execute permission to authenticated users (will check admin role internally)
GRANT EXECUTE ON FUNCTION public.admin_create_user TO authenticated;

-- =====================================================
-- 4. ADD HELPFUL INDEXES
-- =====================================================
-- Improve query performance for RLS checks

CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles(role)
  WHERE role = 'admin';

-- =====================================================
-- 5. VERIFY AND FIX EXISTING DATA
-- =====================================================

-- Ensure all auth users have profiles
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      display_name,
      role,
      created_at,
      updated_at
    )
    VALUES (
      r.id,
      r.email,
      COALESCE(r.raw_user_meta_data->>'full_name', r.email),
      COALESCE(r.raw_user_meta_data->>'full_name', split_part(r.email, '@', 1)),
      COALESCE(r.raw_user_meta_data->>'role', 'senior')::text,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- =====================================================
-- 6. CREATE VIEW FOR DEBUGGING
-- =====================================================
-- Helpful view to check user/profile synchronization

CREATE OR REPLACE VIEW public.user_profile_sync_status AS
SELECT
  u.id,
  u.email as auth_email,
  u.created_at as auth_created,
  p.id as profile_id,
  p.email as profile_email,
  p.role,
  p.created_at as profile_created,
  CASE
    WHEN p.id IS NULL THEN '❌ Missing Profile'
    WHEN u.email != p.email THEN '⚠️ Email Mismatch'
    ELSE '✅ Synced'
  END as sync_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

COMMENT ON VIEW public.user_profile_sync_status IS
  'Debug view to check synchronization between auth.users and profiles';

-- Grant select on view to authenticated users
GRANT SELECT ON public.user_profile_sync_status TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verification queries
DO $$
BEGIN
  RAISE NOTICE 'Profile creation and RLS fixes applied successfully';
  RAISE NOTICE 'Run these queries to verify:';
  RAISE NOTICE '1. SELECT * FROM user_profile_sync_status; -- Check user/profile sync';
  RAISE NOTICE '2. SELECT * FROM pg_policies WHERE tablename = ''profiles''; -- Check RLS policies';
  RAISE NOTICE '3. SELECT * FROM pg_trigger WHERE tgname = ''on_auth_user_created''; -- Check trigger';
END $$;