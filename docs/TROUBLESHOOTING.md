# Para Connect - Troubleshooting Guide

## Table of Contents

1. [Common Issues](#common-issues)
2. [Authentication Problems](#authentication-problems)
3. [Database Issues](#database-issues)
4. [API & Edge Function Errors](#api--edge-function-errors)
5. [Build & Deployment Issues](#build--deployment-issues)
6. [Performance Problems](#performance-problems)
7. [Accessibility Issues](#accessibility-issues)
8. [Development Environment](#development-environment)
9. [FAQ](#faq)
10. [Getting Help](#getting-help)

---

## Common Issues

### Application Won't Start

**Symptom**: `npm run dev` fails or shows errors

**Possible Causes & Solutions**:

#### 1. Missing Environment Variables
```bash
# Error message:
❌ Environment variable validation failed:
  - VITE_SUPABASE_URL: Required

# Solution:
cp .env.example .env.local
# Edit .env.local with your actual Supabase credentials
```

#### 2. Dependencies Not Installed
```bash
# Error: Cannot find module '@/components/...'

# Solution:
rm -rf node_modules package-lock.json
npm install
```

#### 3. Port Already in Use
```bash
# Error: Port 5173 is already in use

# Solution:
# Option 1: Kill the process using the port
lsof -ti:5173 | xargs kill -9

# Option 2: Use a different port
npm run dev -- --port 3000
```

#### 4. Node Version Mismatch
```bash
# Error: The engine "node" is incompatible

# Solution:
# Check your Node version
node --version  # Should be 18.x or 20.x

# Install correct version with nvm
nvm install 20
nvm use 20
```

---

## Authentication Problems

### Can't Sign Up

**Symptom**: Sign up form submits but user not created

**Possible Causes**:

#### 1. Email Already Exists
```
Error: "User already registered"
```
**Solution**: Use a different email or reset password

#### 2. Weak Password
```
Error: "Password must be at least 8 characters with uppercase, lowercase, and number"
```
**Solution**: Use a stronger password meeting requirements

#### 3. Supabase Email Confirmation Required
**Solution**: Check email for confirmation link, or disable email confirmation in Supabase Dashboard:
```
Supabase Dashboard > Authentication > Settings
Disable "Confirm email"
```

### Can't Sign In

**Symptom**: Login fails with error message

**Possible Causes**:

#### 1. Invalid Credentials
```
Error: "Invalid login credentials"
```
**Solution**:
- Double-check email and password
- Use password reset if forgotten
- Ensure email is confirmed (if required)

#### 2. Rate Limiting
```
Error: "Too many login attempts. Please wait 15 minutes."
```
**Solution**: Wait for rate limit to reset or clear localStorage:
```javascript
localStorage.removeItem('rate-limit-login_attempt');
```

#### 3. Session Expired
**Solution**: Sign out and sign back in:
```typescript
await supabase.auth.signOut();
// Then sign in again
```

### Session Not Persisting

**Symptom**: User logged out after page refresh

**Possible Causes**:

#### 1. LocalStorage Disabled
**Solution**: Enable localStorage in browser settings

#### 2. Incognito/Private Mode
**Solution**: Use regular browser window or enable localStorage for private mode

#### 3. Auth Configuration Issue
**Check**: `src/integrations/supabase/client.ts`:
```typescript
auth: {
  storage: localStorage,       // Must be set
  persistSession: true,         // Must be true
  autoRefreshToken: true,
}
```

### "Access Denied" / Unauthorized

**Symptom**: User logged in but can't access certain pages

**Possible Causes**:

#### 1. Wrong User Role
```
Error: "You don't have permission to access this page"
```
**Solution**: Check user role in database:
```sql
SELECT role FROM profiles WHERE id = 'user-uuid';
```

#### 2. RLS Policy Blocking Access
**Solution**: Check RLS policies:
```sql
-- Test policy
SELECT * FROM profiles WHERE id = auth.uid();
-- If returns nothing, RLS policy is blocking
```

#### 3. Care Relationship Not Active
**Solution**: Verify care relationship status:
```sql
SELECT * FROM care_relationships
WHERE (patient_id = 'uuid' OR caregiver_id = 'uuid')
AND status = 'active';
```

---

## Database Issues

### "Row Level Security Policy Violation"

**Symptom**: Database queries fail with RLS error

**Possible Causes**:

#### 1. Missing RLS Policy
**Solution**: Verify policy exists:
```sql
SELECT * FROM pg_policies WHERE tablename = 'table_name';
```

#### 2. Policy Not Matching User
**Debug**: Test policy logic:
```sql
-- Test as specific user
SET request.jwt.claim.sub = 'user-uuid';
SELECT * FROM table_name;
```

#### 3. Service Role Key Used Incorrectly
**Note**: Service role key bypasses RLS - only use for admin operations

### "Unique Constraint Violation"

**Symptom**: Insert fails with duplicate key error

**Possible Causes**:

#### 1. Duplicate Email
```
Error: "duplicate key value violates unique constraint 'profiles_email_key'"
```
**Solution**: Check if user exists:
```sql
SELECT * FROM profiles WHERE email = 'user@example.com';
```

#### 2. Duplicate Care Relationship
```
Error: "duplicate key value violates unique constraint 'care_relationships_patient_id_caregiver_id_key'"
```
**Solution**: Check existing relationship:
```sql
SELECT * FROM care_relationships
WHERE patient_id = 'uuid1' AND caregiver_id = 'uuid2';
```

### Slow Queries

**Symptom**: Database operations taking >1 second

**Possible Causes**:

#### 1. Missing Indexes
**Solution**: Check query plan:
```sql
EXPLAIN ANALYZE SELECT * FROM check_ins WHERE patient_id = 'uuid';
-- Look for "Seq Scan" - indicates missing index
```

#### 2. Too Many Rows Returned
**Solution**: Add pagination:
```typescript
const { data } = await supabase
  .from('check_ins')
  .select('*')
  .range(0, 49)  // First 50 rows
  .order('created_at', { ascending: false });
```

#### 3. Complex Joins
**Solution**: Optimize query or add indexes on foreign keys

---

## API & Edge Function Errors

### "500 Internal Server Error" from Edge Function

**Symptom**: Edge Function returns 500 error

**Possible Causes**:

#### 1. Missing Environment Variable
```bash
# Check Edge Function logs
supabase functions logs senior-chat

# Common error:
"OPENAI_API_KEY not configured"

# Solution:
supabase secrets set OPENAI_API_KEY=sk-...
```

#### 2. OpenAI API Error
```
Error: "OpenAI API rate limit exceeded"
```
**Solution**:
- Check OpenAI account usage limits
- Upgrade OpenAI plan
- Implement request queuing

#### 3. Invalid Request Body
**Solution**: Validate request matches schema:
```typescript
{
  "messages": [
    { "role": "user", "content": "Hello" }
  ]
}
```

### "429 Too Many Requests"

**Symptom**: Rate limit error

**Possible Causes**:

#### 1. Too Many Requests
```
Error: "Rate limit exceeded. Please wait 60 seconds."
```
**Solution**:
- Wait for rate limit to reset
- Implement request queuing
- Increase rate limits (if appropriate)

#### 2. OpenAI Rate Limit
**Solution**:
- Check OpenAI dashboard for rate limits
- Upgrade plan
- Implement exponential backoff

### "401 Unauthorized"

**Symptom**: API returns unauthorized error

**Possible Causes**:

#### 1. Missing Auth Token
**Solution**: Ensure user is authenticated:
```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // Redirect to login
}
```

#### 2. Expired Token
**Solution**: Refresh session:
```typescript
const { data: { session }, error } = await supabase.auth.refreshSession();
```

#### 3. Invalid API Key
**Solution**: Verify Supabase API key:
```typescript
// Check .env.local
console.log('Using API key:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
```

---

## Build & Deployment Issues

### Build Fails with Type Errors

**Symptom**: `npm run build` fails with TypeScript errors

**Possible Causes**:

#### 1. Type Mismatch
```
Error: Type 'string | undefined' is not assignable to type 'string'
```
**Solution**: Add type guard or optional chaining:
```typescript
// Before
const name: string = user.name;

// After
const name: string = user.name ?? 'Unknown';
// or
const name: string | undefined = user.name;
```

#### 2. Missing Type Definitions
```
Error: Cannot find module '@types/...'
```
**Solution**:
```bash
npm install --save-dev @types/module-name
```

### Build Succeeds But App Doesn't Work in Production

**Symptom**: App works in dev but not in production

**Possible Causes**:

#### 1. Environment Variables Not Set
**Solution**: Set variables in hosting platform:
```bash
# Netlify
netlify env:set VITE_SUPABASE_URL "..."

# Vercel
vercel env add VITE_SUPABASE_URL production
```

#### 2. API Endpoints Wrong
**Check**: Ensure production URLs are used:
```
VITE_SUPABASE_URL=https://production-project.supabase.co
```

#### 3. CORS Issues
**Solution**: Configure CORS in Edge Functions:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

### Deployment Times Out

**Symptom**: Netlify/Vercel deployment times out

**Possible Causes**:

#### 1. Build Takes Too Long
**Solution**:
- Optimize dependencies
- Use build cache
- Increase timeout limit

#### 2. Out of Memory
**Solution**: Increase Node memory:
```json
{
  "scripts": {
    "build": "NODE_OPTIONS=--max_old_space_size=4096 vite build"
  }
}
```

---

## Performance Problems

### Slow Page Load

**Symptom**: Pages take >3 seconds to load

**Possible Causes**:

#### 1. Large Bundle Size
**Solution**:
```bash
# Analyze bundle
npm run build
ls -lh dist/assets/

# If >500KB, apply optimizations from PERFORMANCE_OPTIMIZATION_REPORT.md
```

#### 2. Blocking Network Requests
**Solution**: Use React Query for caching:
```typescript
const { data } = useQuery({
  queryKey: ['profiles'],
  queryFn: fetchProfiles,
  staleTime: 5 * 60 * 1000,  // Cache for 5 minutes
});
```

#### 3. Unoptimized Images
**Solution**:
- Use WebP format
- Implement lazy loading
- Add srcset for responsive images

### Excessive Re-renders

**Symptom**: Components re-rendering unnecessarily

**Possible Causes**:

#### 1. Missing Memoization
**Solution**:
```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

#### 2. Inline Function Definitions
**Solution**:
```typescript
// Before (creates new function every render)
<Button onClick={() => handleClick(id)}>Click</Button>

// After
const memoizedHandler = useCallback(() => handleClick(id), [id]);
<Button onClick={memoizedHandler}>Click</Button>
```

---

## Accessibility Issues

### Screen Reader Not Announcing Content

**Symptom**: NVDA/JAWS not reading elements

**Possible Causes**:

#### 1. Missing ARIA Labels
**Solution**:
```tsx
// Add aria-label to buttons
<button aria-label="Close dialog">
  <X aria-hidden="true" />
</button>
```

#### 2. Improper Heading Structure
**Solution**: Ensure heading hierarchy (h1 → h2 → h3):
```tsx
<h1>Main Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
```

#### 3. Missing Form Labels
**Solution**:
```tsx
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

### Keyboard Navigation Not Working

**Symptom**: Can't navigate with Tab key

**Possible Causes**:

#### 1. Divs Used Instead of Buttons
**Solution**:
```tsx
// Before
<div onClick={handleClick}>Click me</div>

// After
<button onClick={handleClick}>Click me</button>
```

#### 2. Missing tabIndex
**Solution**:
```tsx
// For custom interactive elements
<div role="button" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
  Click me
</div>
```

---

## Development Environment

### VS Code Extensions Not Working

**Symptom**: ESLint, TypeScript IntelliSense not working

**Solution**:

1. **Reload VS Code**: Cmd/Ctrl + Shift + P → "Reload Window"

2. **Check Extensions Installed**:
   - ESLint
   - TypeScript and JavaScript Language Features
   - Tailwind CSS IntelliSense

3. **Check Workspace Settings**: `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Git Shows Sensitive Files

**Symptom**: `.env.local` showing in git status

**Solution**: This is normal and correct! `.env.local` should NOT be committed.

**Check `.gitignore`**:
```
.env
.env.local
.env.production
```

### npm install Fails

**Symptom**: Dependencies fail to install

**Possible Causes**:

#### 1. Network Issues
**Solution**:
```bash
# Try different registry
npm config set registry https://registry.npmjs.org/
npm install
```

#### 2. Permission Issues
**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# On Mac/Linux, avoid sudo
# Fix permissions:
sudo chown -R $USER /usr/local/lib/node_modules
```

#### 3. Lock File Conflicts
**Solution**:
```bash
rm package-lock.json
npm install
```

---

## FAQ

### Q: How do I reset my password?
**A**: Click "Forgot Password" on login page. Check email for reset link.

### Q: How do I change my email?
**A**: Currently requires manual database update. Contact support@paraconnect.com

### Q: Can I delete my account?
**A**: Contact support@paraconnect.com for account deletion.

### Q: Why am I getting "Access Denied"?
**A**: Check your user role and care relationships. Only authorized users can access patient data.

### Q: How do I add a caregiver?
**A**:
1. Caregiver creates account
2. Admin or patient creates care relationship
3. Caregiver accepts invitation

### Q: Why is the chat not responding?
**A**:
- Check internet connection
- Verify OpenAI API key is set
- Check Edge Function logs for errors
- Ensure you're authenticated

### Q: How do I export my data?
**A**: Currently requires manual database export. Future feature: data export button.

### Q: Is my data secure?
**A**: Yes. See SECURITY_IMPROVEMENTS_SUMMARY.md for details on security measures.

### Q: How do I report a bug?
**A**:
1. Check this troubleshooting guide first
2. Search GitHub Issues
3. Create new issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser and OS information

### Q: Can I use Para Connect on mobile?
**A**: Yes, the application is fully responsive and works on mobile browsers.

### Q: What browsers are supported?
**A**:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Android)

### Q: Do you have a mobile app?
**A**: Not yet. Mobile apps planned for Q2 2026.

---

## Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Search existing documentation**:
   - PROJECT_OVERVIEW.md
   - DEVELOPER_GUIDE.md
   - API_DOCUMENTATION.md
   - DEPLOYMENT_GUIDE.md
3. **Check browser console** for error messages
4. **Check network tab** for failed requests
5. **Try in incognito mode** to rule out cache/extension issues

### When Asking for Help, Include:

- **What you tried**: Steps to reproduce the issue
- **What happened**: Actual behavior
- **What you expected**: Expected behavior
- **Environment**:
  - Browser and version
  - OS and version
  - Node.js version
  - Para Connect version
- **Error messages**: Console logs, stack traces
- **Screenshots**: If UI-related

### Contact Information

#### For Users
- **General Support**: support@paraconnect.com
- **Response Time**: Within 24-48 hours

#### For Developers
- **GitHub Issues**: https://github.com/your-org/para-connect/issues
- **Developer Chat**: [Your Slack/Discord]
- **Email**: dev@paraconnect.com

#### For Security Issues
- **Email**: security@paraconnect.com
- **PGP Key**: [Link to PGP key]
- **Response Time**: Within 24 hours

#### For Accessibility Issues
- **Email**: accessibility@paraconnect.com
- **Include**: Screen reader, browser, and specific issue

---

## Debug Mode

### Enable Verbose Logging

```typescript
// In src/main.tsx or src/App.tsx
if (import.meta.env.DEV) {
  console.log('=== DEBUG MODE ===');
  console.log('Environment:', import.meta.env);
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
}
```

### Auth Debug

```typescript
// In AuthContext.tsx
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  console.log('Session:', session);
  console.log('User:', session?.user);
});
```

### API Debug

```typescript
// In API calls
console.log('Request:', { url, method, body });
console.log('Response:', response);
```

### RLS Debug

```sql
-- Test policy as specific user
BEGIN;
SET request.jwt.claim.sub = 'user-uuid';
SELECT * FROM table_name;
ROLLBACK;
```

---

## Emergency Procedures

### Application Down

1. **Check Status Page**: [Your status page URL]
2. **Check Supabase Status**: https://status.supabase.com
3. **Check Netlify/Vercel Status**: [Your hosting status]
4. **Roll back deployment** if recently deployed
5. **Contact on-call team**: [On-call number/email]

### Data Breach Suspected

1. **DO NOT PANIC**
2. **Contact security team immediately**: security@paraconnect.com
3. **Document what you observed**
4. **Do not discuss publicly**
5. **Follow incident response plan**

### Database Issues

1. **Check Supabase Dashboard** for alerts
2. **Review recent migrations**
3. **Check database logs**
4. **Restore from backup** if necessary (last resort)
5. **Contact Supabase support** if infrastructure issue

---

## Tools for Debugging

### Browser DevTools
- **Console**: View errors and logs
- **Network**: Monitor API calls
- **Application**: View localStorage, cookies, cache
- **Performance**: Profile performance issues

### React DevTools
- **Components**: Inspect props and state
- **Profiler**: Find performance bottlenecks

### Supabase Dashboard
- **Database**: Run SQL queries
- **Auth**: View users and sessions
- **Logs**: View Edge Function logs
- **API**: Test API endpoints

### External Tools
- **Lighthouse**: Performance and accessibility audits
- **axe DevTools**: Accessibility testing
- **Postman**: API testing
- **Sentry**: Error tracking (if configured)

---

**Document Version**: 1.0.0
**Last Updated**: October 12, 2025
**Maintained By**: Para Connect Support Team
