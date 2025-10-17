/**
 * Supabase Edge Function: admin-create-user
 *
 * Secure admin endpoint for creating users with proper authentication.
 * This function runs server-side with access to the service role key.
 *
 * Usage:
 * POST /functions/v1/admin-create-user
 * Authorization: Bearer <user-jwt-token>
 * Content-Type: application/json
 *
 * Body:
 * {
 *   "email": "user@example.com",
 *   "password": "optional-password",
 *   "full_name": "John Doe",
 *   "role": "senior" | "caregiver" | "admin",
 *   "phone_number": "optional",
 *   "date_of_birth": "optional",
 *   "emergency_contact_name": "optional",
 *   "emergency_contact_phone": "optional"
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password?: string;
  full_name: string;
  role: 'admin' | 'caregiver' | 'senior';
  phone_number?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key (available in Edge Function environment)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the user JWT from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: CreateUserRequest = await req.json();

    // Validate required fields
    if (!body.email || !body.full_name || !body.role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, full_name, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        full_name: body.full_name,
        role: body.role,
      },
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create or update the profile (upsert in case trigger already created it)
    const { data: newProfile, error: profileCreateError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: body.email,
        full_name: body.full_name,
        display_name: body.full_name,
        role: body.role,
        phone_number: body.phone_number || null,
        date_of_birth: body.date_of_birth || null,
        emergency_contact_name: body.emergency_contact_name || null,
        emergency_contact_phone: body.emergency_contact_phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileCreateError) {
      console.error('Profile creation error:', profileCreateError);
      // Don't fail if profile creation fails (trigger might have created it)
    }

    // Log the admin action
    await supabaseAdmin.from('activity_log').insert({
      user_id: user.id,
      activity_type: 'admin_create_user',
      activity_description: `Admin created new user: ${body.email} with role: ${body.role}`,
      activity_metadata: {
        created_user_id: authData.user.id,
        created_user_email: body.email,
        created_user_role: body.role,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: authData.user,
        profile: newProfile,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});