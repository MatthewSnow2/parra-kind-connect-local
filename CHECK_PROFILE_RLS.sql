-- =====================================================
-- DIAGNOSTIC: Check Profile Creation and RLS Policies
-- =====================================================

-- 1. Check if profiles are being created
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  p.id as profile_id,
  p.full_name,
  p.role,
  p.created_at as profile_created,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE - TRIGGER NOT WORKING'
    WHEN p.created_at > u.created_at + interval '5 seconds' THEN '⚠️ PROFILE DELAYED'
    ELSE '✅ PROFILE OK'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- 2. Check RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 3. Test if anon role can read profiles (this might be the issue!)
-- If this returns nothing, RLS is blocking profile reads
SET ROLE anon;
SELECT id, email, full_name, role FROM public.profiles LIMIT 5;
RESET ROLE;

-- 4. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- =====================================================
-- FIX: Add RLS policy to allow users to read their own profile
-- =====================================================

-- This policy allows authenticated users to read their own profile
CREATE POLICY IF NOT EXISTS "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- This policy allows users to update their own profile
CREATE POLICY IF NOT EXISTS "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- This policy allows anon users to insert their profile during signup
CREATE POLICY IF NOT EXISTS "Users can insert their own profile on signup"
ON public.profiles
FOR INSERT
TO authenticated, anon
WITH CHECK (auth.uid() = id);

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verify policies were created
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'profiles';

