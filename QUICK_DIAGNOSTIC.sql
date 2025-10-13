-- =====================================================
-- QUICK DIAGNOSTIC: Check if your user has a profile
-- =====================================================

-- 1. Find your recent user
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  p.id as has_profile,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email LIKE '%@%'  -- Your email
ORDER BY u.created_at DESC
LIMIT 5;

-- 2. Check specifically for your user UUID
SELECT 
  id,
  email,
  full_name,
  display_name,
  role,
  created_at
FROM public.profiles
WHERE id = '7e55271a-96c1-4b58-b765-3243a1917522';

-- 3. If no profile exists, create it manually
-- IMPORTANT: Only run this if the SELECT above returned no rows
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
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
  COALESCE(u.raw_user_meta_data->>'display_name', 'User'),
  COALESCE(u.raw_user_meta_data->>'role', 'senior'),
  u.raw_user_meta_data->>'phone_number',
  NOW(),
  NOW(),
  NOW()
FROM auth.users u
WHERE u.id = '7e55271a-96c1-4b58-b765-3243a1917522'
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u.id);

-- 4. Verify profile was created
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles
WHERE id = '7e55271a-96c1-4b58-b765-3243a1917522';
