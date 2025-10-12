/**
 * ProtectedRoute Component Tests
 *
 * Tests authentication and role-based access control for protected routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { renderWithProviders } from '@/test/utils/test-utils';
import * as AuthContext from '@/contexts/AuthContext';
import { mockSeniorProfile, mockCaregiverProfile } from '@/test/utils/mock-data';

// Mock the AuthContext
const mockUseAuth = vi.spyOn(AuthContext, 'useAuth');

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('displays loading component while initializing', () => {
      mockUseAuth.mockReturnValue({
        isInitializing: true,
        isAuthenticated: false,
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        hasRole: vi.fn(),
        isSenior: false,
        isCaregiver: false,
        isFamilyMember: false,
        isAdmin: false,
      });

      renderWithProviders(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Verifying authentication...')).toBeInTheDocument();
    });

    it('renders custom loading component when provided', () => {
      mockUseAuth.mockReturnValue({
        isInitializing: true,
        isAuthenticated: false,
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        hasRole: vi.fn(),
        isSenior: false,
        isCaregiver: false,
        isFamilyMember: false,
        isAdmin: false,
      });

      renderWithProviders(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute loadingComponent={<div>Custom Loading...</div>}>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
    });
  });

  describe('Authentication Checks', () => {
    it('redirects to login when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isInitializing: false,
        isAuthenticated: false,
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        hasRole: vi.fn(),
        isSenior: false,
        isCaregiver: false,
        isFamilyMember: false,
        isAdmin: false,
      });

      renderWithProviders(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('renders protected content when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        isInitializing: false,
        isAuthenticated: true,
        user: { id: 'test-user-id' } as any,
        profile: mockSeniorProfile,
        session: null,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        hasRole: vi.fn().mockReturnValue(true),
        isSenior: true,
        isCaregiver: false,
        isFamilyMember: false,
        isAdmin: false,
      });

      renderWithProviders(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('redirects to custom path when specified', async () => {
      mockUseAuth.mockReturnValue({
        isInitializing: false,
        isAuthenticated: false,
        user: null,
        profile: null,
        session: null,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        hasRole: vi.fn(),
        isSenior: false,
        isCaregiver: false,
        isFamilyMember: false,
        isAdmin: false,
      });

      renderWithProviders(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/custom-login" element={<div>Custom Login</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute redirectTo="/custom-login">
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Custom Login')).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('allows access when user has required role', () => {
      mockUseAuth.mockReturnValue({
        isInitializing: false,
        isAuthenticated: true,
        user: { id: 'test-user-id' } as any,
        profile: mockSeniorProfile,
        session: null,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        hasRole: vi.fn().mockReturnValue(true),
        isSenior: true,
        isCaregiver: false,
        isFamilyMember: false,
        isAdmin: false,
      });

      renderWithProviders(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute requiredRole="senior">
                  <div>Senior Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Senior Content')).toBeInTheDocument();
    });

    it('denies access when user lacks required role', async () => {
      mockUseAuth.mockReturnValue({
        isInitializing: false,
        isAuthenticated: true,
        user: { id: 'test-user-id' } as any,
        profile: mockSeniorProfile,
        session: null,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        hasRole: vi.fn().mockReturnValue(false),
        isSenior: true,
        isCaregiver: false,
        isFamilyMember: false,
        isAdmin: false,
      });

      renderWithProviders(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/" element={<div>Home Page</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute requiredRole="caregiver">
                  <div>Caregiver Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Home Page')).toBeInTheDocument();
      });
    });

    it('allows access when user has one of multiple required roles', () => {
      mockUseAuth.mockReturnValue({
        isInitializing: false,
        isAuthenticated: true,
        user: { id: 'test-user-id' } as any,
        profile: mockCaregiverProfile,
        session: null,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        hasRole: vi.fn().mockReturnValue(true),
        isSenior: false,
        isCaregiver: true,
        isFamilyMember: false,
        isAdmin: false,
      });

      renderWithProviders(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route
              path="/protected"
              element={
                <ProtectedRoute requiredRole={['caregiver', 'admin']}>
                  <div>Multi-Role Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('Multi-Role Content')).toBeInTheDocument();
    });

    it('redirects to custom unauthorized path', async () => {
      mockUseAuth.mockReturnValue({
        isInitializing: false,
        isAuthenticated: true,
        user: { id: 'test-user-id' } as any,
        profile: mockSeniorProfile,
        session: null,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        hasRole: vi.fn().mockReturnValue(false),
        isSenior: true,
        isCaregiver: false,
        isFamilyMember: false,
        isAdmin: false,
      });

      renderWithProviders(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute
                  requiredRole="caregiver"
                  unauthorizedRedirect="/unauthorized"
                >
                  <div>Caregiver Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing user object', async () => {
      mockUseAuth.mockReturnValue({
        isInitializing: false,
        isAuthenticated: false,
        user: null,
        profile: mockSeniorProfile,
        session: null,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        hasRole: vi.fn(),
        isSenior: false,
        isCaregiver: false,
        isFamilyMember: false,
        isAdmin: false,
      });

      renderWithProviders(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    it('handles missing profile object', async () => {
      mockUseAuth.mockReturnValue({
        isInitializing: false,
        isAuthenticated: false,
        user: { id: 'test-user-id' } as any,
        profile: null,
        session: null,
        isLoading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        refreshProfile: vi.fn(),
        hasRole: vi.fn(),
        isSenior: false,
        isCaregiver: false,
        isFamilyMember: false,
        isAdmin: false,
      });

      renderWithProviders(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });
  });
});
