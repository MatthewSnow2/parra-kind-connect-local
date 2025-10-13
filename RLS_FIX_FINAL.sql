-- =====================================================
-- FIX RLS POLICIES FOR PROFILES TABLE
-- =====================================================
-- Drop existing policies first, then recreate them

-- Drop existing policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile on signup" ON public.profiles;

-- Create policy for SELECT (reading profiles)
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create policy for UPDATE (updating profiles)
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policy for INSERT (creating profile during signup)
CREATE POLICY "Users can insert their own profile on signup"
ON public.profiles
FOR INSERT
TO authenticated, anon
WITH CHECK (auth.uid() = id);

-- Make sure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Verify policies were created
SELECT 
  policyname, 
  cmd, 
  roles::text,
  CASE 
    WHEN cmd = 'SELECT' THEN 'Allows reading own profile'
    WHEN cmd = 'UPDATE' THEN 'Allows updating own profile'
    WHEN cmd = 'INSERT' THEN 'Allows creating profile on signup'
    ELSE 'Other'
  END as description
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd;

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';
