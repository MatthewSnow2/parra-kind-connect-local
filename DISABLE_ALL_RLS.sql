-- =====================================================
-- DISABLE RLS ON ALL TABLES FOR PRE-LAUNCH TESTING
-- =====================================================

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_relationships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_signups DISABLE ROW LEVEL SECURITY;

-- Verify all tables have RLS disabled
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '⚠️ RLS ENABLED' ELSE '✅ RLS DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
