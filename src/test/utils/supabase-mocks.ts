/**
 * Supabase Mocks
 *
 * Mock implementations of Supabase client methods for testing
 */

import { vi } from 'vitest';
import { createMockUser, createMockProfile, createMockSession } from './mock-data';

/**
 * Mock Supabase Auth methods
 */
export const mockSupabaseAuth = {
  getSession: vi.fn().mockResolvedValue({
    data: { session: createMockSession() },
    error: null,
  }),

  signInWithPassword: vi.fn().mockResolvedValue({
    data: {
      user: createMockUser(),
      session: createMockSession(),
    },
    error: null,
  }),

  signUp: vi.fn().mockResolvedValue({
    data: {
      user: createMockUser(),
      session: createMockSession(),
    },
    error: null,
  }),

  signOut: vi.fn().mockResolvedValue({
    error: null,
  }),

  onAuthStateChange: vi.fn((callback) => {
    // Immediately call the callback with initial state
    callback('SIGNED_IN', createMockSession());

    // Return a mock subscription
    return {
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    };
  }),

  getUser: vi.fn().mockResolvedValue({
    data: { user: createMockUser() },
    error: null,
  }),
};

/**
 * Mock Supabase Database methods
 */
export const mockSupabaseFrom = vi.fn((table: string) => ({
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: createMockProfile(),
    error: null,
  }),
  then: vi.fn((resolve) => resolve({
    data: [createMockProfile()],
    error: null,
  })),
}));

/**
 * Mock Supabase Client
 */
export const mockSupabaseClient = {
  auth: mockSupabaseAuth,
  from: mockSupabaseFrom,
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ data: null, error: null }),
      download: vi.fn().mockResolvedValue({ data: null, error: null }),
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/file.jpg' },
      }),
    })),
  },
  functions: {
    invoke: vi.fn().mockResolvedValue({
      data: null,
      error: null,
    }),
  },
};

/**
 * Reset all Supabase mocks
 */
export function resetSupabaseMocks() {
  Object.values(mockSupabaseAuth).forEach((mock) => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  });

  mockSupabaseFrom.mockClear();
}

/**
 * Mock Supabase to throw errors
 */
export function mockSupabaseError(method: keyof typeof mockSupabaseAuth, error: any) {
  (mockSupabaseAuth[method] as any).mockResolvedValueOnce({
    data: null,
    error,
  });
}

/**
 * Mock successful authentication
 */
export function mockSuccessfulAuth() {
  mockSupabaseAuth.getSession.mockResolvedValue({
    data: { session: createMockSession() },
    error: null,
  });

  mockSupabaseAuth.signInWithPassword.mockResolvedValue({
    data: {
      user: createMockUser(),
      session: createMockSession(),
    },
    error: null,
  });
}

/**
 * Mock failed authentication
 */
export function mockFailedAuth(errorMessage = 'Invalid login credentials') {
  mockSupabaseAuth.signInWithPassword.mockResolvedValue({
    data: { user: null, session: null },
    error: { message: errorMessage, status: 400 } as any,
  });
}

/**
 * Mock no session (logged out state)
 */
export function mockNoSession() {
  mockSupabaseAuth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });
}
