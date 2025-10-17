# Admin User Creation Setup Guide

## Problem Summary

The admin user creation was failing with:
1. **403 Forbidden error** when trying to POST to `/auth/v1/admin/users`
2. **Profile fetch timeout** after user creation with "RLS policies are blocking the read"

## Root Causes

1. **Missing Service Role Key**: Admin operations require the service role key, not the public/anon key
2. **RLS Policies**: The Row Level Security policies were blocking profile reads immediately after creation
3. **No Admin API Access**: The frontend was trying to use `supabase.auth.admin.createUser()` which doesn't exist on the client

## Solutions Implemented

### 1. Multiple Fallback Methods for User Creation

Created a robust user creation system with three methods:

#### Method 1: Edge Function (Recommended for Production)
- **File**: `/supabase/functions/admin-create-user/index.ts`
- Secure server-side function with proper authentication
- Validates admin role before allowing user creation
- Handles both auth user and profile creation

#### Method 2: Admin Client (Development Only)
- **File**: `/src/integrations/supabase/admin-client.ts`
- Uses service role key for admin operations
- **WARNING**: Never use in production (exposes service key)

#### Method 3: Database Function (Limited)
- **File**: `/supabase/migrations/20251016_fix_profile_creation_and_rls.sql`
- Creates profile only (no auth user)
- Fallback when other methods unavailable

### 2. Fixed Files

#### Core Files Modified:
- `/src/hooks/admin/useAdminData.ts` - Updated to use new user creation service
- `/src/lib/admin/createUser.ts` - New service with fallback methods
- `/src/integrations/supabase/admin-client.ts` - Admin client for dev
- `/src/config/env.ts` - Added optional service role key support

#### Database Migrations:
- `/supabase/migrations/20251016_fix_profile_creation_and_rls.sql` - Fixed RLS and trigger
- `/supabase/migrations/20251013000001_create_profile_trigger.sql` - Profile creation trigger

#### Edge Function:
- `/supabase/functions/admin-create-user/index.ts` - Secure user creation endpoint

## Setup Instructions

### Option 1: Production Setup (Recommended)

1. **Deploy the Edge Function**:
   ```bash
   supabase functions deploy admin-create-user
   ```

2. **Run the migration**:
   ```bash
   supabase db push
   ```

3. That's it! The system will automatically use the Edge Function.

### Option 2: Development Setup (Quick)

1. **Get your service role key**:
   - Go to Supabase Dashboard
   - Navigate to Settings > API
   - Copy the "service_role" key (starts with `eyJ...`)

2. **Add to .env.local**:
   ```env
   VITE_SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   ```

3. **Run the migration**:
   ```bash
   supabase db push
   ```

4. **Restart your dev server**:
   ```bash
   npm run dev
   ```

### Option 3: Manual Database Setup

If you can't deploy Edge Functions or use service role key:

1. **Run the migration** to create database function:
   ```sql
   -- Run the migration file:
   supabase/migrations/20251016_fix_profile_creation_and_rls.sql
   ```

2. **Note**: This creates profiles only, not auth users. Users won't be able to log in.

## What Was Fixed

### 1. RLS Policies
- Added proper SELECT policy for users to read their own profile
- Added service role bypass for admin operations
- Fixed profile creation trigger to handle conflicts

### 2. Profile Creation Trigger
- Improved error handling
- Uses UPSERT to handle conflicts
- Doesn't fail user creation if profile creation fails

### 3. User Creation Flow
- Validates input before attempting creation
- Provides clear error messages
- Falls back through multiple methods
- Waits for trigger to create profile before fetching

### 4. Error Messages
- Clear, actionable error messages
- Specific guidance on what's wrong
- Instructions on how to fix issues

## Testing the Fix

1. **Log in as an admin user**
2. **Navigate to Admin > Users**
3. **Click "Add User"**
4. **Fill in the form**:
   - Email: matthew.snow2@gmail.com
   - Full Name: Matthew Snow
   - Role: Senior/Caregiver/Admin
5. **Click "Create User"**

The user should be created successfully without errors.

## Troubleshooting

### Still getting 403 errors?

1. **Check you're logged in as admin**:
   ```sql
   SELECT * FROM profiles WHERE id = auth.uid();
   -- Should show role = 'admin'
   ```

2. **Verify Edge Function is deployed**:
   ```bash
   supabase functions list
   -- Should show "admin-create-user"
   ```

3. **Check service role key (dev only)**:
   - Ensure it starts with `eyJ`
   - Ensure it's different from the anon key
   - Check it's in .env.local, not .env

### Profile not created?

1. **Check trigger exists**:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. **Check RLS policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```

3. **Check user/profile sync**:
   ```sql
   SELECT * FROM user_profile_sync_status;
   ```

### Profile fetch timeout?

This is now fixed by the improved RLS policies. If still occurring:

1. **Temporarily disable RLS** (dev only):
   ```sql
   ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
   ```

2. **Re-enable after testing**:
   ```sql
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ```

## Security Notes

1. **NEVER expose service role key in production**
2. **Always use Edge Functions for admin operations in production**
3. **Service role key in frontend is for development only**
4. **Consider using Supabase Auth Hooks for custom user creation logic**

## Summary

The admin user creation is now fixed with:
- ✅ Multiple fallback methods for reliability
- ✅ Proper RLS policies for profile access
- ✅ Automatic profile creation trigger
- ✅ Clear error messages and logging
- ✅ Production-ready Edge Function
- ✅ Development shortcuts for testing

Users can now be created from the admin panel without 403 errors, and profiles are properly created and accessible.