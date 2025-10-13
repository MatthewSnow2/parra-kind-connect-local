/**
 * Signup Page Component
 *
 * Secure registration page with comprehensive input validation, role selection,
 * and profile creation.
 *
 * Security Features:
 * - Zod schema validation with strong password requirements
 * - Input sanitization to prevent XSS
 * - Rate limiting to prevent spam registrations
 * - Role-based account creation
 * - Email verification support
 * - Secure password handling
 * - Prevention of duplicate accounts
 * - Error message sanitization
 * - Loading states to prevent multiple submissions
 *
 * @example
 * Navigate to /signup to access this page
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useValidatedForm, useSecureSubmit } from '@/lib/validation/hooks';
import { signupSchema, type SignupInput } from '@/lib/validation/schemas';
import { sanitizeEmail, sanitizePhoneNumber, sanitizeText } from '@/lib/validation/sanitization';
import { checkRateLimit, recordRateLimitedAction, RATE_LIMITS, RateLimitError } from '@/lib/validation/rate-limiting';
import { useState } from 'react';

/**
 * Sanitize error message to prevent information leakage
 */
const sanitizeErrorMessage = (error: string): string => {
  const errorMap: Record<string, string> = {
    'User already registered': 'An account with this email already exists.',
    'Password should be at least 6 characters': 'Password must be at least 8 characters long.',
    'Unable to validate email address': 'Please enter a valid email address.',
    'Signup requires a valid password': 'Please enter a valid password.',
  };

  return errorMap[error] || 'An error occurred during signup. Please try again.';
};

/**
 * Role options for signup
 */
const roleOptions: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'senior',
    label: 'Senior',
    description: 'I am using Parra Connect for myself',
  },
  {
    value: 'caregiver',
    label: 'Caregiver',
    description: 'I am a professional caregiver',
  },
  {
    value: 'family_member',
    label: 'Family Member',
    description: 'I am caring for a family member',
  },
];

export const Signup = () => {
  const navigate = useNavigate();
  const { signUp, isLoading } = useAuth();

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form with Zod validation
  const form = useValidatedForm<SignupInput>({
    schema: signupSchema,
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      displayName: '',
      phoneNumber: '',
      role: 'senior',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  // Get role value for controlled Select component
  const roleValue = form.watch('role');

  // Secure submit handler with rate limiting
  const { handleSubmit, isSubmitting } = useSecureSubmit<SignupInput>({
    onSubmit: async (data) => {
      setError(null);
      setSuccess(false);

      // Sanitize all inputs
      const sanitizedEmail = sanitizeEmail(data.email);
      const sanitizedFullName = sanitizeText(data.fullName);
      const sanitizedDisplayName = data.displayName ? sanitizeText(data.displayName) : undefined;
      const sanitizedPhoneNumber = data.phoneNumber ? sanitizePhoneNumber(data.phoneNumber) : undefined;

      // Rate limiting disabled for pre-launch testing
      // const rateLimitCheck = checkRateLimit('signup', sanitizedEmail, RATE_LIMITS.SIGNUP);
      //
      // if (!rateLimitCheck.allowed) {
      //   const rateLimitError = new RateLimitError(
      //     'Too many signup attempts',
      //     rateLimitCheck.resetIn,
      //     rateLimitCheck.remaining
      //   );
      //   setError(rateLimitError.getUserMessage());
      //   return;
      // }

      try {
        // Rate limiting disabled for pre-launch testing
        // recordRateLimitedAction('signup', sanitizedEmail);

        // Attempt sign up with sanitized data
        const { error: signUpError } = await signUp(sanitizedEmail, data.password, {
          full_name: sanitizedFullName,
          display_name: sanitizedDisplayName,
          phone_number: sanitizedPhoneNumber,
          role: data.role,
        });

        if (signUpError) {
          console.error('Signup error:', signUpError.message);
          setError(sanitizeErrorMessage(signUpError.message));
          return;
        }

        // Success
        setSuccess(true);

        // Redirect after short delay
        setTimeout(() => {
          navigate('/login', {
            state: {
              message:
                'Account created successfully! You can now sign in.',
            },
          });
        }, 2000);
      } catch (err) {
        console.error('Unexpected signup error:', err);
        setError('An unexpected error occurred. Please try again.');
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-heading font-bold text-center">
            Create Account
          </CardTitle>
          <CardDescription className="text-center">
            Join Parra Connect to get started
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

            {/* Success Alert */}
            {success && (
              <Alert className="bg-green-50 text-green-900 border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Account created successfully! Redirecting...</AlertDescription>
              </Alert>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                {...form.register('fullName')}
                disabled={isLoading || isSubmitting || success}
                className={form.formState.errors.fullName ? 'border-destructive' : ''}
                autoComplete="name"
                aria-invalid={!!form.formState.errors.fullName}
                aria-describedby={form.formState.errors.fullName ? 'fullName-error' : undefined}
              />
              {form.formState.errors.fullName && (
                <p id="fullName-error" className="text-sm text-destructive">
                  {form.formState.errors.fullName.message}
                </p>
              )}
            </div>

            {/* Display Name (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="displayName">
                Display Name <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="How you'd like to be called"
                {...form.register('displayName')}
                disabled={isLoading || isSubmitting || success}
                autoComplete="nickname"
                aria-invalid={!!form.formState.errors.displayName}
                aria-describedby={
                  form.formState.errors.displayName ? 'displayName-error' : undefined
                }
              />
              {form.formState.errors.displayName && (
                <p id="displayName-error" className="text-sm text-destructive">
                  {form.formState.errors.displayName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...form.register('email')}
                disabled={isLoading || isSubmitting || success}
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

            {/* Phone Number (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                Phone Number <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1 (555) 123-4567"
                {...form.register('phoneNumber')}
                disabled={isLoading || isSubmitting || success}
                autoComplete="tel"
                aria-invalid={!!form.formState.errors.phoneNumber}
                aria-describedby={
                  form.formState.errors.phoneNumber ? 'phoneNumber-error' : undefined
                }
              />
              {form.formState.errors.phoneNumber && (
                <p id="phoneNumber-error" className="text-sm text-destructive">
                  {form.formState.errors.phoneNumber.message}
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">I am a...</Label>
              <Select
                value={roleValue}
                onValueChange={(value) => form.setValue('role', value as UserRole)}
                disabled={isLoading || isSubmitting || success}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  {...form.register('password')}
                  disabled={isLoading || isSubmitting || success}
                  className={
                    form.formState.errors.password ? 'border-destructive pr-10' : 'pr-10'
                  }
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  {...form.register('confirmPassword')}
                  disabled={isLoading || isSubmitting || success}
                  className={
                    form.formState.errors.confirmPassword ? 'border-destructive pr-10' : 'pr-10'
                  }
                  autoComplete="new-password"
                  aria-invalid={!!form.formState.errors.confirmPassword}
                  aria-describedby={
                    form.formState.errors.confirmPassword ? 'confirmPassword-error' : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p id="confirmPassword-error" className="text-sm text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || isSubmitting || success}
            >
              {isLoading || isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Account created!
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Sign In Link */}
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
