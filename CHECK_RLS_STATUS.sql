-- =====================================================
-- CHECK RLS STATUS AND POLICIES
-- =====================================================

-- 1. Check if RLS is enabled
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 2. List all policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text[] as applies_to_roles,
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'profiles';

-- 3. Test if authenticated role can read profiles
-- (This simulates what happens when user is logged in)
SELECT 
  'Testing authenticated role access...' as test,
  auth.uid() as current_user_id,
  COUNT(*) as profiles_visible
FROM public.profiles
WHERE id = auth.uid();

-- 4. Check your specific user
SELECT 
  u.id as user_id,
  u.email,
  p.id as profile_id,
  p.full_name,
  p.role,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    ELSE '✅ PROFILE EXISTS'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.id = '7e55271a-96c1-4b58-b765-3243a1917522';
