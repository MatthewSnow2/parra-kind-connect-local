-- =====================================================
-- FIX RLS POLICIES FOR CARE_RELATIONSHIPS TABLE
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Caregivers can view their relationships" ON public.care_relationships;
DROP POLICY IF EXISTS "Patients can view their relationships" ON public.care_relationships;
DROP POLICY IF EXISTS "Caregivers can create relationships" ON public.care_relationships;
DROP POLICY IF EXISTS "Caregivers can update their relationships" ON public.care_relationships;
DROP POLICY IF EXISTS "Users can delete their own relationships" ON public.care_relationships;

-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage all relationships" ON public.care_relationships;
CREATE POLICY "Admins can manage all relationships"
ON public.care_relationships
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Caregivers can view their own relationships
CREATE POLICY "Caregivers can view their relationships"
ON public.care_relationships
FOR SELECT
TO authenticated
USING (caregiver_id = auth.uid());

-- Patients can view their relationships
CREATE POLICY "Patients can view their relationships"
ON public.care_relationships
FOR SELECT
TO authenticated
USING (patient_id = auth.uid());

-- Caregivers can create relationships (for themselves)
CREATE POLICY "Caregivers can create relationships"
ON public.care_relationships
FOR INSERT
TO authenticated
WITH CHECK (
  caregiver_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('caregiver', 'family_member', 'admin')
  )
);

-- Caregivers can update their own relationships
CREATE POLICY "Caregivers can update their relationships"
ON public.care_relationships
FOR UPDATE
TO authenticated
USING (caregiver_id = auth.uid())
WITH CHECK (caregiver_id = auth.uid());

-- Users can delete their own relationships
CREATE POLICY "Users can delete their own relationships"
ON public.care_relationships
FOR DELETE
TO authenticated
USING (caregiver_id = auth.uid() OR patient_id = auth.uid());

-- Enable RLS
ALTER TABLE public.care_relationships ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT 
  policyname,
  cmd as operation,
  roles::text[] as applies_to,
  CASE cmd
    WHEN 'ALL' THEN 'Full access for admins'
    WHEN 'SELECT' THEN 'Read relationships'
    WHEN 'INSERT' THEN 'Create relationships'
    WHEN 'UPDATE' THEN 'Update relationships'
    WHEN 'DELETE' THEN 'Delete relationships'
  END as description
FROM pg_policies
WHERE tablename = 'care_relationships'
ORDER BY cmd;
