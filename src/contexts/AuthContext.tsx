/**
 * Authentication Context and Provider
 *
 * This module provides a secure authentication context for the Parra Connect application.
 * It manages user sessions, authentication state, and role-based access control.
 *
 * Security Features:
 * - Secure session management via Supabase Auth
 * - Automatic token refresh and session persistence
 * - Role-based access control (RBAC)
 * - Protected profile data access
 * - Secure logout with proper cleanup
 * - Auth state change listeners
 * - Loading states for auth operations
 *
 * @example
 * ```tsx
 * // Wrap your app with AuthProvider
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 *
 * // Use the hook in components
 * const { user, profile, signOut, isLoading } = useAuth();
 * ```
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

/**
 * User profile from the profiles table
 */
export type UserProfile = Tables<'profiles'>;

/**
 * User role types for role-based access control
 */
export type UserRole = 'senior' | 'caregiver' | 'family_member' | 'admin';

/**
 * Authentication state interface
 */
export interface AuthState {
  // Current authenticated user (from Supabase Auth)
  user: User | null;
  // User profile data (from profiles table)
  profile: UserProfile | null;
  // Current session
  session: Session | null;
  // Loading state for auth operations
  isLoading: boolean;
  // Initial loading state (app startup)
  isInitializing: boolean;
  // Whether user is authenticated
  isAuthenticated: boolean;
}

/**
 * Authentication context methods
 */
export interface AuthContextType extends AuthState {
  // Sign in with email and password
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  // Sign up with email, password, and profile data
  signUp: (
    email: string,
    password: string,
    profileData: {
      full_name: string;
      role: UserRole;
      display_name?: string;
      phone_number?: string;
    }
  ) => Promise<{ error: AuthError | null }>;
  // Sign out and clear session
  signOut: () => Promise<void>;
  // Refresh user profile data
  refreshProfile: () => Promise<void>;
  // Check if user has specific role
  hasRole: (role: UserRole | UserRole[]) => boolean;
  // Check if user is senior
  isSenior: boolean;
  // Check if user is caregiver
  isCaregiver: boolean;
  // Check if user is family member
  isFamilyMember: boolean;
  // Check if user is admin
  isAdmin: boolean;
}

// Create context with undefined default (will throw if used outside provider)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 *
 * Manages authentication state and provides auth methods to child components.
 * Automatically syncs with Supabase Auth state changes.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  /**
   * Fetch user profile from database
   * Uses row-level security policies to ensure users can only access their own profile
   */
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('[AUTH] Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[AUTH] Error fetching profile:', error);
        console.error('[AUTH] Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return null;
      }

      console.log('[AUTH] Profile fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('[AUTH] Unexpected error fetching profile:', error);
      return null;
    }
  }, []);

  /**
   * Refresh user profile data
   */
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, fetchProfile]);

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Session and user will be updated by onAuthStateChange listener
      return { error: null };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up with email, password, and profile data
   */
  const signUp = async (
    email: string,
    password: string,
    profileData: {
      full_name: string;
      role: UserRole;
      display_name?: string;
      phone_number?: string;
    }
  ) => {
    setIsLoading(true);
    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Pass profile data to be used in the database trigger
          data: {
            full_name: profileData.full_name,
            role: profileData.role,
            display_name: profileData.display_name,
            phone_number: profileData.phone_number,
          },
        },
      });

      if (authError) {
        return { error: authError };
      }

      // Step 2: Profile should be created automatically by database trigger
      // If not, create it manually (fallback)
      if (authData.user) {
        console.log('[SIGNUP] User created, checking for profile...', authData.user.id);

        // Wait a moment for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        const existingProfile = await fetchProfile(authData.user.id);

        if (!existingProfile) {
          console.log('[SIGNUP] Profile not found, creating manually...');
          // Create profile manually if trigger didn't work
          const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            email: email,
            full_name: profileData.full_name,
            role: profileData.role,
            display_name: profileData.display_name || null,
            phone_number: profileData.phone_number || null,
          });

          if (profileError) {
            console.error('[SIGNUP] Error creating profile:', profileError);
            // Don't return error here - auth user was created successfully
          } else {
            console.log('[SIGNUP] Profile created manually successfully');
          }
        } else {
          console.log('[SIGNUP] Profile found via trigger:', existingProfile);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      return {
        error: {
          message: 'An unexpected error occurred during signup',
          status: 500,
        } as AuthError
      };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign out and clear all auth state
   */
  const signOut = async () => {
    setIsLoading(true);
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Error signing out:', error);
      }

      // Clear local state (will also be cleared by onAuthStateChange listener)
      setUser(null);
      setProfile(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if user has specific role(s)
   */
  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!profile) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(profile.role);
    },
    [profile]
  );

  // Computed role checks
  const isSenior = hasRole('senior');
  const isCaregiver = hasRole('caregiver');
  const isFamilyMember = hasRole('family_member');
  const isAdmin = hasRole('admin');

  /**
   * Initialize auth state and set up auth listener
   */
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          const profileData = await fetchProfile(initialSession.user.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event);

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // User signed in - fetch profile
          const profileData = await fetchProfile(currentSession.user.id);
          setProfile(profileData);
        } else {
          // User signed out - clear profile
          setProfile(null);
        }

        // Mark initialization as complete on first auth event
        if (isInitializing) {
          setIsInitializing(false);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, isInitializing]);

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isInitializing,
    isAuthenticated: !!user && !!profile,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    hasRole,
    isSenior,
    isCaregiver,
    isFamilyMember,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access auth context
 *
 * @throws {Error} If used outside of AuthProvider
 *
 * @example
 * ```tsx
 * const { user, profile, signOut, isLoading } = useAuth();
 *
 * if (isLoading) return <Spinner />;
 * if (!user) return <LoginPrompt />;
 *
 * return <div>Welcome, {profile.full_name}!</div>;
 * ```
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
