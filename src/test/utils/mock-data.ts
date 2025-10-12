/**
 * Mock Data for Testing
 *
 * Reusable mock data objects for consistent testing across the application
 */

import { User, Session } from '@supabase/supabase-js';
import type { UserProfile, UserRole } from '@/contexts/AuthContext';

/**
 * Create a mock Supabase User
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'test@example.com',
    ...overrides,
  } as User;
}

/**
 * Create a mock User Profile
 */
export function createMockProfile(
  overrides?: Partial<UserProfile>
): UserProfile {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    full_name: 'Test User',
    display_name: 'Test',
    phone_number: '+1234567890',
    role: 'senior' as UserRole,
    avatar_url: null,
    bio: null,
    emergency_contact: null,
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock Supabase Session
 */
export function createMockSession(overrides?: Partial<Session>): Session {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
    user: createMockUser(),
    ...overrides,
  } as Session;
}

/**
 * Mock senior user
 */
export const mockSeniorUser = createMockUser({
  id: 'senior-user-id',
  email: 'senior@example.com',
});

export const mockSeniorProfile = createMockProfile({
  id: 'senior-user-id',
  email: 'senior@example.com',
  full_name: 'Senior User',
  role: 'senior',
});

/**
 * Mock caregiver user
 */
export const mockCaregiverUser = createMockUser({
  id: 'caregiver-user-id',
  email: 'caregiver@example.com',
});

export const mockCaregiverProfile = createMockProfile({
  id: 'caregiver-user-id',
  email: 'caregiver@example.com',
  full_name: 'Caregiver User',
  role: 'caregiver',
});

/**
 * Mock family member user
 */
export const mockFamilyMemberUser = createMockUser({
  id: 'family-user-id',
  email: 'family@example.com',
});

export const mockFamilyMemberProfile = createMockProfile({
  id: 'family-user-id',
  email: 'family@example.com',
  full_name: 'Family Member',
  role: 'family_member',
});

/**
 * Mock admin user
 */
export const mockAdminUser = createMockUser({
  id: 'admin-user-id',
  email: 'admin@example.com',
});

export const mockAdminProfile = createMockProfile({
  id: 'admin-user-id',
  email: 'admin@example.com',
  full_name: 'Admin User',
  role: 'admin',
});

/**
 * Mock chat messages
 */
export const mockChatMessages = [
  {
    id: 1,
    text: 'Good morning! How are you feeling today?',
    sender: 'ai' as const,
    timestamp: '9:00 AM',
  },
  {
    id: 2,
    text: "I'm feeling good, had a nice walk this morning",
    sender: 'senior' as const,
    timestamp: '9:05 AM',
  },
  {
    id: 3,
    text: 'That\'s wonderful! Did you remember to take your morning medication?',
    sender: 'ai' as const,
    timestamp: '9:06 AM',
  },
];

/**
 * Mock form data
 */
export const mockLoginData = {
  email: 'test@example.com',
  password: 'SecurePassword123',
};

export const mockSignupData = {
  email: 'newuser@example.com',
  password: 'SecurePassword123',
  confirmPassword: 'SecurePassword123',
  fullName: 'New User',
  displayName: 'New',
  phoneNumber: '+1234567890',
  role: 'senior' as UserRole,
};

/**
 * Mock validation errors
 */
export const mockValidationErrors = {
  email: {
    invalid: 'Invalid email format',
    required: 'Email is required',
  },
  password: {
    weak: 'Password must contain at least one uppercase letter',
    short: 'Password must be at least 8 characters',
    required: 'Password is required',
  },
  confirmPassword: {
    mismatch: 'Passwords do not match',
  },
};
