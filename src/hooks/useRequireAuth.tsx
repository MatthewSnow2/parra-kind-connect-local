/**
 * useRequireAuth Hook
 *
 * A security-focused hook that enforces authentication requirements.
 * Automatically redirects unauthenticated users to the login page.
 * Optionally enforces role-based access control.
 *
 * Security Features:
 * - Automatic redirection for unauthenticated users
 * - Role-based access control enforcement
 * - Preserves intended destination for post-login redirect
 * - Loading state management
 * - Type-safe role checking
 *
 * @example
 * ```tsx
 * // Require any authenticated user
 * const RequireAuthComponent = () => {
 *   const { user, profile } = useRequireAuth();
 *   return <div>Hello {profile.full_name}</div>;
 * };
 *
 * // Require specific role
 * const CaregiverOnlyComponent = () => {
 *   const { user, profile } = useRequireAuth({ requiredRole: 'caregiver' });
 *   return <div>Caregiver Dashboard</div>;
 * };
 *
 * // Require one of multiple roles
 * const AdminOrCaregiverComponent = () => {
 *   const { user, profile } = useRequireAuth({
 *     requiredRole: ['admin', 'caregiver']
 *   });
 *   return <div>Management Interface</div>;
 * };
 * ```
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '@/contexts/AuthContext';

/**
 * Options for useRequireAuth hook
 */
export interface UseRequireAuthOptions {
  /**
   * Role(s) required to access this resource
   * If not specified, any authenticated user can access
   */
  requiredRole?: UserRole | UserRole[];

  /**
   * Custom redirect path if user is not authenticated
   * Defaults to '/login'
   */
  redirectTo?: string;

  /**
   * Custom redirect path if user doesn't have required role
   * Defaults to '/unauthorized' or '/' if not set
   */
  unauthorizedRedirect?: string;
}

/**
 * Hook that requires authentication and optionally specific roles
 *
 * This hook will:
 * 1. Redirect to login if user is not authenticated
 * 2. Redirect to unauthorized page if user doesn't have required role
 * 3. Preserve the intended destination for post-login redirect
 * 4. Return the authenticated user and profile once verified
 *
 * @param options - Configuration options for auth requirements
 * @returns Auth context with verified user and profile
 */
export const useRequireAuth = (options: UseRequireAuthOptions = {}) => {
  const {
    requiredRole,
    redirectTo = '/login',
    unauthorizedRedirect = '/',
  } = options;

  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for initial auth check to complete
    if (auth.isInitializing) {
      return;
    }

    // Check if user is authenticated
    if (!auth.isAuthenticated || !auth.user || !auth.profile) {
      // Save current location for post-login redirect
      const returnTo = location.pathname + location.search;

      // Redirect to login with return URL
      navigate(redirectTo, {
        replace: true,
        state: { from: returnTo },
      });
      return;
    }

    // Check role requirements if specified
    if (requiredRole) {
      const hasRequiredRole = auth.hasRole(requiredRole);

      if (!hasRequiredRole) {
        console.warn(
          `Access denied: User role "${auth.profile.role}" does not match required role(s)`,
          requiredRole
        );

        // Redirect to unauthorized page
        navigate(unauthorizedRedirect, { replace: true });
        return;
      }
    }
  }, [
    auth.isInitializing,
    auth.isAuthenticated,
    auth.user,
    auth.profile,
    requiredRole,
    auth.hasRole,
    navigate,
    location,
    redirectTo,
    unauthorizedRedirect,
  ]);

  // Return auth context
  // Note: The actual user/profile will be available after the effect runs
  return auth;
};

/**
 * Hook to access the current user profile
 * Requires authentication but doesn't redirect
 * Returns null if user is not authenticated
 *
 * @example
 * ```tsx
 * const UserGreeting = () => {
 *   const user = useUser();
 *   if (!user) return <div>Please log in</div>;
 *   return <div>Hello {user.full_name}</div>;
 * };
 * ```
 */
export const useUser = () => {
  const { profile } = useAuth();
  return profile;
};

/**
 * Hook to check if user has specific role(s)
 *
 * @example
 * ```tsx
 * const AdminPanel = () => {
 *   const canAccess = useHasRole(['admin', 'caregiver']);
 *   if (!canAccess) return <div>Access Denied</div>;
 *   return <div>Admin Panel</div>;
 * };
 * ```
 */
export const useHasRole = (roles: UserRole | UserRole[]) => {
  const { hasRole } = useAuth();
  return hasRole(roles);
};
