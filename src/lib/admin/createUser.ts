/**
 * Admin User Creation Service
 *
 * Provides secure user creation for admins with multiple fallback methods:
 * 1. Edge Function (production - recommended)
 * 2. Admin client with service role (development only)
 * 3. Database function (limited functionality)
 */

import { supabase } from '@/integrations/supabase/client';
import { adminOperations } from '@/integrations/supabase/admin-client';

export interface CreateUserInput {
  email: string;
  password?: string;
  full_name: string;
  display_name?: string;
  role: 'admin' | 'caregiver' | 'senior';
  phone_number?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

/**
 * Attempts to create a user using the Edge Function (recommended for production)
 */
async function createUserViaEdgeFunction(input: CreateUserInput) {
  const { data: session } = await supabase.auth.getSession();

  if (!session?.session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.session.access_token}`,
      },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to create user via Edge Function');
  }

  return response.json();
}

/**
 * Attempts to create a user using the admin client (development only)
 */
async function createUserViaAdminClient(input: CreateUserInput) {
  if (!adminOperations) {
    throw new Error('Admin operations not available');
  }

  return adminOperations.createUser({
    email: input.email,
    password: input.password,
    full_name: input.full_name,
    role: input.role,
    phone_number: input.phone_number,
    date_of_birth: input.date_of_birth,
    emergency_contact_name: input.emergency_contact_name,
    emergency_contact_phone: input.emergency_contact_phone,
  });
}

/**
 * Creates a user profile using database function (limited - no auth user)
 */
async function createUserViaDatabase(input: CreateUserInput) {
  const { data, error } = await supabase.rpc('admin_create_user', {
    p_email: input.email,
    p_password: input.password,
    p_full_name: input.full_name,
    p_role: input.role,
    p_phone_number: input.phone_number,
    p_date_of_birth: input.date_of_birth,
    p_emergency_contact_name: input.emergency_contact_name,
    p_emergency_contact_phone: input.emergency_contact_phone,
  });

  if (error) throw error;
  return data;
}

/**
 * Main function to create a user with multiple fallback methods
 *
 * Priority:
 * 1. Edge Function (if deployed)
 * 2. Admin client (if service role key available)
 * 3. Database function (limited functionality)
 */
export async function createUser(input: CreateUserInput) {
  const errors: string[] = [];

  // Method 1: Try Edge Function first (best for production)
  try {
    const result = await createUserViaEdgeFunction(input);
    console.log('User created via Edge Function');
    return result;
  } catch (error: any) {
    errors.push(`Edge Function: ${error.message}`);
    console.warn('Edge Function failed:', error.message);
  }

  // Method 2: Try admin client (development only)
  try {
    const result = await createUserViaAdminClient(input);
    console.log('User created via Admin Client');
    return result;
  } catch (error: any) {
    errors.push(`Admin Client: ${error.message}`);
    console.warn('Admin client failed:', error.message);
  }

  // Method 3: Try database function (limited)
  try {
    const result = await createUserViaDatabase(input);
    console.warn(
      'User profile created via database function. ' +
      'Auth user creation requires Edge Function or Admin API.'
    );
    return result;
  } catch (error: any) {
    errors.push(`Database Function: ${error.message}`);
    console.error('Database function failed:', error.message);
  }

  // All methods failed
  throw new Error(
    'Failed to create user. Errors:\n' + errors.join('\n') +
    '\n\nTo fix this:\n' +
    '1. Deploy the Edge Function: supabase functions deploy admin-create-user\n' +
    '2. Or add VITE_SUPABASE_SERVICE_ROLE_KEY to .env.local (dev only)\n' +
    '3. Or use the Supabase dashboard to create users manually'
  );
}

/**
 * Checks if the current user has admin privileges
 */
export async function checkAdminPrivileges(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

/**
 * Validates user input before creation
 */
export function validateUserInput(input: Partial<CreateUserInput>): string[] {
  const errors: string[] = [];

  if (!input.email) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.push('Invalid email format');
  }

  if (!input.full_name) {
    errors.push('Full name is required');
  }

  if (!input.role) {
    errors.push('Role is required');
  } else if (!['admin', 'caregiver', 'senior'].includes(input.role)) {
    errors.push('Invalid role. Must be admin, caregiver, or senior');
  }

  if (input.phone_number && !/^[\d\s\-\+\(\)]+$/.test(input.phone_number)) {
    errors.push('Invalid phone number format');
  }

  if (input.date_of_birth) {
    const date = new Date(input.date_of_birth);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date of birth');
    }
  }

  return errors;
}