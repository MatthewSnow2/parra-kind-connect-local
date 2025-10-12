# Para Connect Authentication System

## Table of Contents

1. [Overview](#overview)
2. [Security Architecture](#security-architecture)
3. [Authentication Flow](#authentication-flow)
4. [Role-Based Access Control](#role-based-access-control)
5. [Implementation Guide](#implementation-guide)
6. [API Reference](#api-reference)
7. [Security Best Practices](#security-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Para Connect implements a comprehensive authentication system using **Supabase Auth** with the following security features:

- **Secure session management** with automatic token refresh
- **Role-based access control (RBAC)** for different user types
- **Protected routes** with automatic redirection
- **Input validation and sanitization** on all auth forms
- **Secure password requirements** (8+ characters, uppercase, lowercase, number)
- **Error message sanitization** to prevent information leakage
- **Activity logging** for security auditing
- **Row-level security (RLS)** policies in the database

### User Roles

The system supports four user roles:

- **Senior**: Elderly users who use the Para Connect companion service
- **Caregiver**: Professional caregivers who monitor seniors
- **Family Member**: Family members who care for their loved ones
- **Admin**: System administrators with elevated permissions

---

## Security Architecture

### Authentication Layer

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Protected Components (useAuth, ProtectedRoute)   │  │
│  └───────────────────────────────────────────────────┘  │
│                           ↓                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │       AuthContext (Session Management)            │  │
│  └───────────────────────────────────────────────────┘  │
│                           ↓                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Supabase Auth Client                      │  │
│  │    (JWT tokens, session storage, refresh)         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   Supabase Backend                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Row-Level Security Policies                      │  │
│  │  - Users can only access their own data           │  │
│  │  - Caregivers can access linked patients          │  │
│  │  - Admins have elevated access                    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Key Security Features

1. **JWT-based Authentication**: Secure token-based authentication with automatic refresh
2. **HttpOnly Cookies**: Session tokens stored securely (configured in Supabase)
3. **CSRF Protection**: Built into Supabase Auth
4. **Input Validation**: All user inputs validated and sanitized
5. **Password Hashing**: Bcrypt hashing with salt (handled by Supabase)
6. **Rate Limiting**: Login attempt rate limiting (configured in Supabase)
7. **Session Timeout**: Automatic logout after inactivity
8. **Secure Error Messages**: Sanitized errors that don't leak sensitive info

---

## Authentication Flow

### Sign Up Flow

```
1. User fills out signup form
   ↓
2. Client validates input (email format, password strength)
   ↓
3. Client sends request to Supabase Auth
   ↓
4. Supabase creates auth user and sends verification email
   ↓
5. Database trigger creates profile record with role
   ↓
6. User verifies email (optional, based on config)
   ↓
7. User can now sign in
```

### Sign In Flow

```
1. User enters credentials
   ↓
2. Client validates input
   ↓
3. Client sends request to Supabase Auth
   ↓
4. Supabase validates credentials and returns session
   ↓
5. AuthContext stores user and profile data
   ↓
6. User redirected to intended destination or dashboard
```

### Session Management

```
App Startup:
├── Check for existing session in localStorage
├── If session exists:
│   ├── Validate with Supabase
│   ├── Fetch user profile from database
│   └── Auto-refresh token if needed
└── If no session:
    └── User remains unauthenticated

Session Refresh (automatic):
├── Token nearing expiration
├── Supabase auto-refreshes token
└── AuthContext updates session
```

---

## Role-Based Access Control

### Role Hierarchy

```
Admin > Caregiver/Family Member > Senior
```

### Route Access Matrix

| Route | Senior | Caregiver | Family Member | Admin | Public |
|-------|--------|-----------|---------------|-------|--------|
| `/` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/login` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/signup` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/senior/*` | ✓ | ✗ | ✗ | ✗ | ✗ |
| `/dashboard` | ✗ | ✓ | ✓ | ✓ | ✗ |
| `/features` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/about` | ✓ | ✓ | ✓ | ✓ | ✓ |

### Database Access Control

Row-Level Security (RLS) policies ensure users can only access authorized data:

**Profiles Table:**
- Users can read and update their own profile
- Admins can read all profiles

**Check-ins Table:**
- Seniors can read/write their own check-ins
- Caregivers can read check-ins for linked patients
- Admins can read all check-ins

**Care Relationships Table:**
- Users can see their own relationships
- Admins can manage all relationships

**Caregiver Notes Table:**
- Caregivers can create/read notes for linked patients
- Seniors can read notes shared with them
- Admins can read all notes

---

## Implementation Guide

### 1. Setup Authentication Context

The `AuthProvider` must wrap your entire application:

```tsx
// src/App.tsx
import { AuthProvider } from "@/contexts/AuthContext";

const App = () => (
  <AuthProvider>
    {/* Your app components */}
  </AuthProvider>
);
```

### 2. Protect Routes

Use `ProtectedRoute` component to restrict access:

```tsx
import ProtectedRoute from "@/components/ProtectedRoute";

// Require any authenticated user
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

// Require specific role
<Route
  path="/senior/chat"
  element={
    <ProtectedRoute requiredRole="senior">
      <SeniorChat />
    </ProtectedRoute>
  }
/>

// Require one of multiple roles
<Route
  path="/dashboard"
  element={
    <ProtectedRoute requiredRole={["caregiver", "admin"]}>
      <CaregiverDashboard />
    </ProtectedRoute>
  }
/>
```

### 3. Access Auth State in Components

Use the `useAuth` hook to access authentication state:

```tsx
import { useAuth } from "@/contexts/AuthContext";

const MyComponent = () => {
  const {
    user,           // Current user from Supabase Auth
    profile,        // User profile from database
    isAuthenticated, // Boolean flag
    isLoading,      // Loading state
    signOut,        // Sign out function
    hasRole,        // Check role function
    isSenior,       // Convenience flags
    isCaregiver,
    isAdmin
  } = useAuth();

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <LoginPrompt />;

  return <div>Hello {profile.full_name}!</div>;
};
```

### 4. Require Authentication in Pages

Use `useRequireAuth` hook for automatic redirection:

```tsx
import { useRequireAuth } from "@/hooks/useRequireAuth";

const ProtectedPage = () => {
  // Automatically redirects if not authenticated
  const { user, profile } = useRequireAuth();

  return <div>Protected content for {profile.full_name}</div>;
};

// With role requirement
const CaregiverOnlyPage = () => {
  const { user, profile } = useRequireAuth({
    requiredRole: "caregiver"
  });

  return <div>Caregiver dashboard</div>;
};
```

### 5. Implement Login/Signup

Forms are already implemented at:
- `/src/pages/Login.tsx`
- `/src/pages/Signup.tsx`

Key features:
- Input validation
- Password strength checking
- Error sanitization
- Loading states
- Post-login redirect

---

## API Reference

### AuthContext

#### State Properties

```typescript
interface AuthState {
  user: User | null;              // Supabase auth user
  profile: UserProfile | null;    // User profile from database
  session: Session | null;        // Current session
  isLoading: boolean;             // Loading state for operations
  isInitializing: boolean;        // Initial auth check
  isAuthenticated: boolean;       // True if user is authenticated
}
```

#### Methods

```typescript
// Sign in with email and password
signIn(email: string, password: string): Promise<{ error: AuthError | null }>

// Sign up new user with profile data
signUp(
  email: string,
  password: string,
  profileData: {
    full_name: string;
    role: UserRole;
    display_name?: string;
    phone_number?: string;
  }
): Promise<{ error: AuthError | null }>

// Sign out current user
signOut(): Promise<void>

// Refresh user profile from database
refreshProfile(): Promise<void>

// Check if user has specific role(s)
hasRole(role: UserRole | UserRole[]): boolean
```

#### Convenience Properties

```typescript
isSenior: boolean        // True if user is senior
isCaregiver: boolean     // True if user is caregiver
isFamilyMember: boolean  // True if user is family member
isAdmin: boolean         // True if user is admin
```

### ProtectedRoute Component

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;              // Default: '/login'
  unauthorizedRedirect?: string;    // Default: '/'
  loadingComponent?: React.ReactNode;
}
```

### useRequireAuth Hook

```typescript
interface UseRequireAuthOptions {
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;              // Default: '/login'
  unauthorizedRedirect?: string;    // Default: '/'
}

useRequireAuth(options?: UseRequireAuthOptions): AuthContextType
```

---

## Security Best Practices

### For Developers

1. **Never log sensitive data**: Passwords, tokens, or personal information
2. **Always validate input**: Client-side AND server-side
3. **Use parameterized queries**: Prevent SQL injection
4. **Sanitize error messages**: Don't leak system information
5. **Implement proper RLS**: Row-level security on all tables
6. **Use secure connections**: HTTPS only in production
7. **Regular security audits**: Review auth code and dependencies
8. **Monitor failed logins**: Track and alert on suspicious activity

### Password Requirements

Enforced in signup form:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

Recommended (not enforced):
- At least one special character
- No common passwords
- No personal information

### Session Management

- Sessions expire after inactivity (configured in Supabase)
- Tokens automatically refresh when needed
- Users must re-authenticate for sensitive operations
- Sessions invalidated on password change
- Sign out clears all local auth state

### Data Access

- Users can only access their own data by default
- Caregivers can access data for linked patients only
- All database queries include user ID checks
- RLS policies enforce access control at database level
- Audit logs track data access

---

## Troubleshooting

### Common Issues

#### "Authentication required" error

**Cause**: User not authenticated or session expired
**Solution**: Check if user is signed in, verify session is valid

```tsx
const { isAuthenticated, isInitializing } = useAuth();

if (isInitializing) {
  return <Loading />;
}

if (!isAuthenticated) {
  // Redirect to login or show auth prompt
}
```

#### "Access denied" / Unauthorized

**Cause**: User doesn't have required role
**Solution**: Check user role and adjust route protection

```tsx
const { profile, hasRole } = useAuth();

if (!hasRole(['admin', 'caregiver'])) {
  return <AccessDenied />;
}
```

#### Session not persisting

**Cause**: localStorage issues or auth config problem
**Solution**: Check browser settings, verify Supabase client config

```typescript
// In src/integrations/supabase/client.ts
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: localStorage,    // Ensure this is set
    persistSession: true,      // Ensure this is true
    autoRefreshToken: true,    // Auto-refresh enabled
  }
});
```

#### Profile not loading

**Cause**: Database trigger not working or RLS policy issue
**Solution**: Check if profile was created, verify RLS policies

```sql
-- Check if profile exists
SELECT * FROM profiles WHERE id = 'user-id';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### Debug Mode

Enable debug logging in AuthContext:

```typescript
// In AuthContext.tsx, add to auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  console.log('Session:', session);
  console.log('User:', session?.user);
});
```

### Security Audit Checklist

- [ ] All routes protected with appropriate role requirements
- [ ] Input validation on all forms
- [ ] Error messages sanitized
- [ ] RLS policies enabled on all tables
- [ ] Password requirements enforced
- [ ] Session timeout configured
- [ ] HTTPS enabled in production
- [ ] API keys not exposed in client code
- [ ] Audit logging enabled
- [ ] Regular dependency updates

---

## Support

For security vulnerabilities, please email: security@paraconnect.com

For general auth issues:
1. Check this documentation
2. Review Supabase Auth logs
3. Check browser console for errors
4. Verify environment variables are set correctly

---

## Changelog

### Version 1.0.0 (Current)

- Initial implementation of authentication system
- Supabase Auth integration
- Role-based access control
- Protected routes
- Login/signup pages
- Session management
- Profile management
- Security best practices

---

**Last Updated**: 2025-10-12
**Maintained By**: Para Connect Development Team
