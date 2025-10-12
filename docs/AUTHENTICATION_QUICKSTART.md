# Authentication Quick Start Guide

## Overview

This guide helps you quickly get started with the Para Connect authentication system.

---

## Installation Complete!

The authentication system is now fully implemented. No additional packages needed - everything uses Supabase Auth which is already installed.

---

## Files Created

### Core Authentication Files

- `/src/contexts/AuthContext.tsx` - Main authentication context and provider
- `/src/hooks/useRequireAuth.tsx` - Authentication hooks
- `/src/components/ProtectedRoute.tsx` - Route protection component
- `/src/pages/Login.tsx` - Login page
- `/src/pages/Signup.tsx` - Signup page

### Updated Files

- `/src/App.tsx` - Wrapped with AuthProvider, added protected routes
- `/src/pages/CaregiverDashboard.tsx` - Uses authenticated user ID
- `/src/pages/SeniorChat.tsx` - Uses authenticated user ID
- `/src/pages/PatientDashboard.tsx` - Uses authenticated user ID
- `/src/components/HamburgerMenu.tsx` - Auth-aware navigation with logout

### Documentation

- `/workspace/para-kind-connect-local/docs/AUTHENTICATION.md` - Full documentation
- `/workspace/para-kind-connect-local/docs/AUTHENTICATION_QUICKSTART.md` - This file

---

## Quick Start

### 1. The app is already configured!

The `App.tsx` has been updated with:
- `AuthProvider` wrapping the entire app
- Protected routes for authenticated pages
- Login and signup routes

### 2. Test Authentication

**Sign Up:**
1. Navigate to `/signup`
2. Fill in your details
3. Select your role (Senior, Caregiver, or Family Member)
4. Create a strong password (8+ chars, uppercase, lowercase, number)
5. Submit

**Sign In:**
1. Navigate to `/login`
2. Enter your email and password
3. You'll be redirected to the appropriate dashboard

**Sign Out:**
1. Open the hamburger menu (top right)
2. Click "Sign Out"

### 3. Access Control Works Automatically

- **Senior routes** (`/senior/*`) - Only accessible to users with "senior" role
- **Caregiver routes** (`/dashboard`) - Accessible to caregivers, family members, and admins
- **Public routes** (`/`, `/features`, `/about`) - Accessible to everyone

Try accessing `/senior/chat` without logging in - you'll be redirected to `/login`!

---

## Usage Examples

### Use Auth in Any Component

```tsx
import { useAuth } from "@/contexts/AuthContext";

const MyComponent = () => {
  const { user, profile, isAuthenticated, signOut } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {profile.full_name}!</h1>
      <p>Role: {profile.role}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};
```

### Protect a New Route

```tsx
// In App.tsx
<Route
  path="/my-protected-page"
  element={
    <ProtectedRoute requiredRole="caregiver">
      <MyProtectedPage />
    </ProtectedRoute>
  }
/>
```

### Require Auth in a Page Component

```tsx
import { useRequireAuth } from "@/hooks/useRequireAuth";

const MyPage = () => {
  // Automatically redirects if not authenticated
  const { user, profile } = useRequireAuth({
    requiredRole: "caregiver"  // Optional
  });

  return <div>Protected content</div>;
};
```

---

## Database Setup Required

### Create Care Relationships

For caregivers to see patients, you need to create care relationships in the database:

```sql
-- Example: Link a caregiver to a senior
INSERT INTO care_relationships (
  patient_id,
  caregiver_id,
  relationship_type,
  relationship_label,
  can_view_health_data,
  can_receive_alerts,
  status
) VALUES (
  'senior-user-id',       -- ID of the senior
  'caregiver-user-id',    -- ID of the caregiver
  'professional',
  'Primary Caregiver',
  true,
  true,
  'active'
);
```

**Note:** Replace the user IDs with actual IDs from your `profiles` table.

### Row-Level Security (RLS)

Make sure RLS policies are enabled on all tables. The policies should:

1. **Profiles**: Users can read/update their own profile
2. **Check-ins**: Seniors can CRUD their check-ins, caregivers can read linked patients' check-ins
3. **Daily Summaries**: Same as check-ins
4. **Caregiver Notes**: Caregivers can create notes for linked patients, patients can read their notes
5. **Care Relationships**: Users can see their own relationships
6. **Alerts**: Caregivers can see alerts for linked patients

Example RLS policy for `check_ins`:

```sql
-- Seniors can manage their own check-ins
CREATE POLICY "Users can manage own check-ins"
ON check_ins
FOR ALL
USING (auth.uid() = patient_id)
WITH CHECK (auth.uid() = patient_id);

-- Caregivers can view linked patients' check-ins
CREATE POLICY "Caregivers can view patient check-ins"
ON check_ins
FOR SELECT
USING (
  auth.uid() IN (
    SELECT caregiver_id
    FROM care_relationships
    WHERE patient_id = check_ins.patient_id
    AND status = 'active'
  )
);
```

---

## Security Features Implemented

✅ **Secure Session Management**
- JWT-based authentication
- Automatic token refresh
- Persistent sessions in localStorage
- Secure logout with cleanup

✅ **Input Validation**
- Email format validation
- Strong password requirements
- Input sanitization
- Error message sanitization

✅ **Role-Based Access Control**
- Four user roles (Senior, Caregiver, Family Member, Admin)
- Protected routes
- Database-level access control
- Role checking in components

✅ **Security Best Practices**
- No hardcoded credentials
- No sensitive data in logs
- CSRF protection via Supabase
- Secure error handling
- Password strength requirements

✅ **User Experience**
- Loading states
- Post-login redirect to intended page
- Persistent sessions
- Auto-refresh tokens
- Graceful error handling

---

## Testing Checklist

After implementing authentication, test these scenarios:

### Public Access
- [ ] Can access home page (`/`) without login
- [ ] Can access login page (`/login`)
- [ ] Can access signup page (`/signup`)
- [ ] Can access features, about, privacy, terms pages

### Sign Up
- [ ] Can create a new account with valid data
- [ ] Email validation works (rejects invalid emails)
- [ ] Password validation works (requires 8+ chars, uppercase, lowercase, number)
- [ ] Password confirmation works (rejects mismatched passwords)
- [ ] Role selection works
- [ ] Redirects to login after successful signup

### Sign In
- [ ] Can sign in with valid credentials
- [ ] Invalid credentials show error message
- [ ] Redirects to dashboard after login
- [ ] Session persists after page refresh

### Protected Routes
- [ ] `/senior/*` routes require "senior" role
- [ ] `/dashboard` routes require caregiver/family/admin role
- [ ] Unauthenticated users redirected to login
- [ ] Wrong role users redirected to home

### User Experience
- [ ] Loading states show during auth operations
- [ ] Error messages are clear and helpful
- [ ] Navigation shows user info when logged in
- [ ] Can sign out successfully
- [ ] Intended page is remembered after login

---

## Common Issues and Solutions

### Issue: Can't log in after signup
**Solution**: Make sure the profile was created in the database. Check the `profiles` table.

### Issue: "Access denied" error
**Solution**: Check that the user has the correct role. Caregivers need a `care_relationship` record to access patient data.

### Issue: Session doesn't persist
**Solution**: Check browser localStorage settings. Make sure cookies are enabled.

### Issue: Wrong role can access protected route
**Solution**: Verify the `requiredRole` prop on `ProtectedRoute` is set correctly.

---

## Next Steps

1. **Test the authentication flow** - Create accounts with different roles
2. **Set up care relationships** - Link caregivers to patients in the database
3. **Configure RLS policies** - Ensure proper data access control
4. **Test role-based access** - Verify each role can only access appropriate routes
5. **Monitor auth logs** - Check Supabase dashboard for auth events

---

## Support

For more detailed information, see:
- Full documentation: `/docs/AUTHENTICATION.md`
- Supabase Auth docs: https://supabase.com/docs/guides/auth

For issues:
1. Check browser console for errors
2. Check Supabase Auth logs
3. Verify environment variables are set
4. Review RLS policies in database

---

**You're all set!** The authentication system is fully implemented and ready to use.
