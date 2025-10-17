/**
 * Admin Supabase Client Configuration
 *
 * IMPORTANT SECURITY NOTE:
 * This file creates an admin client with service role key for admin operations.
 * The service role key should NEVER be exposed to the frontend.
 *
 * For production, admin operations should be handled through:
 * 1. Supabase Edge Functions (recommended)
 * 2. Backend API with proper authentication
 * 3. Database functions with security definer
 *
 * This is a temporary solution for development/testing.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { env } from '@/config/env';

// Check if service role key is available (only for admin operations)
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

/**
 * Creates an admin client with service role privileges
 * WARNING: Only use this in secure backend environments
 *
 * @returns Admin Supabase client or null if service key not available
 */
export const createAdminClient = () => {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Service role key not found. Admin operations will not work.');
    return null;
  }

  return createClient<Database>(
    env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

/**
 * Admin operations wrapper
 * This provides a safer way to perform admin operations
 */
export const adminOperations = {
  /**
   * Create a new user with admin privileges
   * This should be moved to an Edge Function in production
   */
  async createUser(input: {
    email: string;
    password?: string;
    full_name: string;
    role: 'admin' | 'caregiver' | 'senior';
    phone_number?: string;
    date_of_birth?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  }) {
    const adminClient = createAdminClient();

    if (!adminClient) {
      throw new Error('Admin client not available. Please configure service role key.');
    }

    try {
      // Create the auth user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          full_name: input.full_name,
          role: input.role,
        },
      });

      if (authError) {
        console.error('Auth creation error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user - no user data returned');
      }

      // The profile will be created automatically by the trigger
      // but we can also create it explicitly if needed
      const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: input.email,
          full_name: input.full_name,
          display_name: input.full_name,
          role: input.role,
          phone_number: input.phone_number || null,
          date_of_birth: input.date_of_birth || null,
          emergency_contact_name: input.emergency_contact_name || null,
          emergency_contact_phone: input.emergency_contact_phone || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't throw here as the trigger might have already created it
      }

      return { user: authData.user, profile };
    } catch (error) {
      console.error('Admin user creation failed:', error);
      throw error;
    }
  },

  /**
   * Delete a user (auth and profile)
   */
  async deleteUser(userId: string) {
    const adminClient = createAdminClient();

    if (!adminClient) {
      throw new Error('Admin client not available. Please configure service role key.');
    }

    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) throw error;

    // Profile will be deleted via CASCADE
  },

  /**
   * Update user metadata
   */
  async updateUserMetadata(userId: string, metadata: Record<string, any>) {
    const adminClient = createAdminClient();

    if (!adminClient) {
      throw new Error('Admin client not available. Please configure service role key.');
    }

    const { data, error } = await adminClient.auth.admin.updateUserById(
      userId,
      { user_metadata: metadata }
    );

    if (error) throw error;
    return data;
  },

  /**
   * List all users (with pagination)
   */
  async listUsers(page = 1, perPage = 50) {
    const adminClient = createAdminClient();

    if (!adminClient) {
      throw new Error('Admin client not available. Please configure service role key.');
    }

    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;
    return data;
  },
};