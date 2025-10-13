# Signup Hang Issue - Quick Fix

## Problem
The signup form is hanging on "Creating account..." because the profile creation is failing.

## Root Cause
The profile trigger migration (`20251013000001_create_profile_trigger.sql`) was created but **never deployed to Supabase**.

## Solution - Deploy the Profile Trigger

### Step 1: Deploy the Trigger to Supabase

1. Go to Supabase SQL Editor: https://app.supabase.com
2. Select your project: `xoygyimwkmepwjqmnfxh`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the entire contents of `/workspace/para-kind-connect-local/supabase/migrations/20251013000001_create_profile_trigger.sql`
6. Click **Run** (or press Ctrl+Enter)

### Step 2: Verify the Trigger Exists

Run this query to verify:

```sql
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

You should see 1 row showing the trigger is active.

### Step 3: Check Email Confirmation Settings

While you're in Supabase Dashboard:

1. Go to **Authentication** > **Settings**
2. Find "Enable email confirmations"
3. **Toggle it OFF** (for pre-launch testing)
4. Click **Save**

### Step 4: Test Signup Again

Now try creating an account again. The profile should be created automatically!

## Alternative: Temporary Workaround (If you can't deploy trigger immediately)

If you need to test right now and can't deploy the trigger, you can manually create the profile after signup:

1. Try to sign up (it will create the auth user but hang on profile)
2. Go to Supabase **Authentication** > **Users**
3. Find your newly created user and copy their UUID
4. Go to **SQL Editor** and run:

```sql
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
  'YOUR_USER_UUID_HERE',  -- Replace with UUID from step 3
  'your-email@example.com',
  'Your Full Name',
  'Display Name',
  'senior',  -- or 'caregiver', 'family_member', 'admin'
  '+1234567890',  -- optional
  NOW(),
  NOW(),
  NOW()
);
```

Then you can log in!

## Diagnostic Query

To see if profiles are being created, run:

```sql
-- Check for users missing profiles
SELECT 
  u.id,
  u.email,
  u.created_at,
  CASE WHEN p.id IS NULL THEN '❌ MISSING PROFILE' ELSE '✅ Has Profile' END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

## Why This Happened

The migration file was committed to git but migrations need to be **manually run in Supabase** either via:
- SQL Editor (what we're doing)
- Supabase CLI: `npx supabase db push`
- Supabase Dashboard: Database > Migrations

Git commits don't automatically deploy database changes to Supabase.
