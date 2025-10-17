-- =====================================================
-- FIX MOOD CHECK CONSTRAINT
-- =====================================================
-- The daily_summaries.overall_mood constraint doesn't include 'anxious'
-- but check_ins.mood_detected does, causing trigger failures

-- Drop the existing constraint
ALTER TABLE public.daily_summaries
DROP CONSTRAINT IF EXISTS daily_summaries_overall_mood_check;

-- Add new constraint that includes 'anxious' and 'confused'
ALTER TABLE public.daily_summaries
ADD CONSTRAINT daily_summaries_overall_mood_check
CHECK (overall_mood IN ('happy', 'neutral', 'sad', 'concerned', 'anxious', 'confused', 'mixed'));

-- Verification query
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'daily_summaries_overall_mood_check';
