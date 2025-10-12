/**
 * ProtectedRoute Component
 *
 * A security-focused route wrapper that enforces authentication and role-based
 * access control at the routing level. Works with React Router to protect routes
 * from unauthorized access.
 *
 * Security Features:
 * - Authentication requirement enforcement
 * - Role-based access control (RBAC)
 * - Automatic redirect for unauthorized users
 * - Loading states during auth verification
 * - Preserved redirect after login
 * - Type-safe role checking
 *
 * @example
 * ```tsx
 * // In App.tsx or routes configuration
 *
 * // Protect route - any authenticated user
 * <Route
 *   path="/dashboard"
 *   element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
 * />
 *
 * // Protect route - specific role required
 * <Route
 *   path="/caregiver/dashboard"
 *   element={
 *     <ProtectedRoute requiredRole="caregiver">
 *       <CaregiverDashboard />
 *     </ProtectedRoute>
 *   }
 * />
 *
 * // Protect route - multiple allowed roles
 * <Route
 *   path="/admin"
 *   element={
 *     <ProtectedRoute requiredRole={["admin", "caregiver"]}>
 *       <AdminPanel />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Props for ProtectedRoute component
 */
export interface ProtectedRouteProps {
  /**
   * Child components to render if user is authorized
   */
  children: React.ReactNode;

  /**
   * Role(s) required to access this route
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
   * Defaults to '/'
   */
  unauthorizedRedirect?: string;

  /**
   * Custom loading component to show during auth check
   */
  loadingComponent?: React.ReactNode;
}

/**
 * Loading component shown while checking authentication
 */
const DefaultLoadingComponent: React.FC = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
      <p className="text-lg text-muted-foreground">Verifying authentication...</p>
    </div>
  </div>
);

/**
 * ProtectedRoute Component
 *
 * Wraps route components to enforce authentication and role-based access control.
 * Handles loading states, redirects, and authorization checks.
 *
 * Flow:
 * 1. Shows loading state while auth is initializing
 * 2. Redirects to login if user is not authenticated
 * 3. Checks role requirements if specified
 * 4. Redirects to unauthorized page if role doesn't match
 * 5. Renders children if all checks pass
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/login',
  unauthorizedRedirect = '/',
  loadingComponent,
}) => {
  const { isInitializing, isAuthenticated, user, profile, hasRole } = useAuth();
  const location = useLocation();

  // Show loading state while initializing auth
  if (isInitializing) {
    return <>{loadingComponent || <DefaultLoadingComponent />}</>;
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user || !profile) {
    // Save current location for post-login redirect
    const returnTo = location.pathname + location.search;

    return (
      <Navigate
        to={redirectTo}
        replace
        state={{ from: returnTo }}
      />
    );
  }

  // Check role requirements if specified
  if (requiredRole) {
    const hasRequiredRole = hasRole(requiredRole);

    if (!hasRequiredRole) {
      console.warn(
        'ProtectedRoute: Access denied - User role does not match requirements',
        {
          userRole: profile.role,
          requiredRole,
          userId: user.id,
          path: location.pathname,
        }
      );

      return (
        <Navigate
          to={unauthorizedRedirect}
          replace
          state={{
            unauthorized: true,
            requiredRole,
            userRole: profile.role,
          }}
        />
      );
    }
  }

  // All checks passed - render children
  return <>{children}</>;
};

/**
 * Higher-order component version of ProtectedRoute
 *
 * @example
 * ```tsx
 * const ProtectedDashboard = withProtectedRoute(Dashboard, {
 *   requiredRole: 'caregiver'
 * });
 *
 * <Route path="/dashboard" element={<ProtectedDashboard />} />
 * ```
 */
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  return (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
}

export default ProtectedRoute;
