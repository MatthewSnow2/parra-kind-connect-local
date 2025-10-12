/**
 * Login Page Component
 *
 * Secure authentication page with comprehensive input validation and error handling.
 *
 * Security Features:
 * - Zod schema validation for all inputs
 * - Input sanitization to prevent XSS
 * - Rate limiting to prevent brute force attacks
 * - Secure password handling (never logged or exposed)
 * - CSRF protection via Supabase Auth
 * - Secure session management
 * - Error message sanitization (no sensitive info leakage)
 * - Post-login redirect to intended destination
 * - Loading states to prevent multiple submissions
 *
 * @example
 * Navigate to /login to access this page
 */

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useValidatedForm, useSecureSubmit } from '@/lib/validation/hooks';
import { loginSchema, type LoginInput } from '@/lib/validation/schemas';
import { sanitizeEmail } from '@/lib/validation/sanitization';
import { checkRateLimit, recordRateLimitedAction, RATE_LIMITS, RateLimitError } from '@/lib/validation/rate-limiting';
import { useState } from 'react';

/**
 * Sanitize error message to prevent information leakage
 * Maps Supabase auth errors to user-friendly messages
 */
const sanitizeErrorMessage = (error: string): string => {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password. Please try again.',
    'Email not confirmed': 'Please verify your email address before logging in.',
    'User not found': 'Invalid email or password. Please try again.',
    'Invalid password': 'Invalid email or password. Please try again.',
    'Too many requests': 'Too many login attempts. Please try again later.',
  };

  // Return mapped message or generic error
  return errorMap[error] || 'An error occurred during login. Please try again.';
};

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isLoading } = useAuth();

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with Zod validation
  const form = useValidatedForm<LoginInput>({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  // Secure submit handler with rate limiting
  const { handleSubmit, isSubmitting } = useSecureSubmit<LoginInput>({
    onSubmit: async (data) => {
      setError(null);

      // Sanitize email input
      const sanitizedEmail = sanitizeEmail(data.email);

      // Check rate limit
      const rateLimitCheck = checkRateLimit('login', sanitizedEmail, RATE_LIMITS.LOGIN);

      if (!rateLimitCheck.allowed) {
        const rateLimitError = new RateLimitError(
          'Too many login attempts',
          rateLimitCheck.resetIn,
          rateLimitCheck.remaining
        );
        setError(rateLimitError.getUserMessage());
        return;
      }

      try {
        // Record attempt for rate limiting
        recordRateLimitedAction('login', sanitizedEmail);

        // Attempt sign in with sanitized email
        const { error: signInError } = await signIn(sanitizedEmail, data.password);

        if (signInError) {
          console.error('Login error:', signInError.message);
          setError(sanitizeErrorMessage(signInError.message));
          return;
        }

        // Success - redirect to intended destination or home
        const from = (location.state as { from?: string })?.from || '/dashboard';
        navigate(from, { replace: true });
      } catch (err) {
        console.error('Unexpected login error:', err);
        setError('An unexpected error occurred. Please try again.');
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-heading font-bold text-center">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to your Para Connect account
          </CardDescription>
        </CardHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...form.register('email')}
                disabled={isLoading || isSubmitting}
                className={form.formState.errors.email ? 'border-destructive' : ''}
                autoComplete="email"
                aria-invalid={!!form.formState.errors.email}
                aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
              />
              {form.formState.errors.email && (
                <p id="email-error" className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...form.register('password')}
                  disabled={isLoading || isSubmitting}
                  className={
                    form.formState.errors.password ? 'border-destructive pr-10' : 'pr-10'
                  }
                  autoComplete="current-password"
                  aria-invalid={!!form.formState.errors.password}
                  aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p id="password-error" className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || isSubmitting}
            >
              {isLoading || isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>

            {/* Sign Up Link */}
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
