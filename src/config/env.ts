/**
 * Environment Variable Validation and Configuration
 *
 * This module provides runtime validation of environment variables using Zod.
 * It ensures that all required environment variables are present and properly formatted
 * before the application starts, preventing runtime errors due to misconfiguration.
 *
 * Security benefits:
 * - Fail-fast: Application won't start with invalid configuration
 * - Type safety: TypeScript types are inferred from the Zod schema
 * - Validation: Ensures URLs are valid, keys are present, etc.
 * - Documentation: Schema serves as documentation for required env vars
 */

import { z } from 'zod';

/**
 * Environment variable schema definition
 *
 * All environment variables should be defined here with appropriate validation rules.
 * Use .url() for URLs, .min() for minimum string lengths, .regex() for patterns, etc.
 */
const envSchema = z.object({
  // Supabase Configuration
  VITE_SUPABASE_PROJECT_ID: z
    .string()
    .min(1, 'Supabase Project ID is required')
    .describe('Supabase project identifier'),

  VITE_SUPABASE_URL: z
    .string()
    .url('Supabase URL must be a valid URL')
    .startsWith('https://', 'Supabase URL must use HTTPS')
    .describe('Supabase project URL'),

  VITE_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20, 'Supabase publishable key appears to be invalid')
    .regex(/^eyJ/, 'Supabase key should be a valid JWT token')
    .describe('Supabase anonymous/public key (safe for client-side use)'),

  // Optional: Service role key for admin operations
  // WARNING: Never expose this to the frontend in production!
  VITE_SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(20, 'Supabase service role key appears to be invalid')
    .regex(/^eyJ/, 'Supabase service role key should be a valid JWT token')
    .describe('Supabase service role key (ONLY for admin operations - keep secret!)')
    .optional(),
});

/**
 * Validated and typed environment variables
 *
 * This object is exported and should be used throughout the application
 * instead of accessing import.meta.env directly.
 *
 * Benefits:
 * - Type safety: TypeScript knows the exact shape and types
 * - Validation: Values are guaranteed to be valid
 * - Centralized: Single source of truth for environment configuration
 * - Auto-complete: IDE can provide suggestions
 */
export const env = (() => {
  try {
    // Parse and validate environment variables
    const parsed = envSchema.parse({
      VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      VITE_SUPABASE_SERVICE_ROLE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
    });

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors for better readability
      const errorMessage = error.errors
        .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');

      console.error(
        '\n❌ Environment variable validation failed:\n\n' +
        errorMessage +
        '\n\n' +
        'Please check your .env.local file and ensure all required variables are set.\n' +
        'See .env.example for the required format.\n'
      );
    }

    // Throw error to prevent app from starting with invalid config
    throw new Error('Invalid environment configuration. Please check console for details.');
  }
})();

/**
 * Type inference: Get TypeScript type from Zod schema
 * This ensures type safety when using env variables throughout the app
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Runtime environment check
 * Returns true if running in production mode
 */
export const isProduction = import.meta.env.PROD;

/**
 * Runtime environment check
 * Returns true if running in development mode
 */
export const isDevelopment = import.meta.env.DEV;

/**
 * Security utility: Check if a value looks like a secret
 * Useful for preventing accidental logging of sensitive data
 */
export function looksLikeSecret(value: string): boolean {
  const secretPatterns = [
    /^[A-Za-z0-9+/]{20,}={0,2}$/, // Base64 encoded (like JWT)
    /^[0-9a-f]{32,}$/i, // Hex encoded (like API keys)
    /^sk_[a-zA-Z0-9]{20,}$/, // Common secret key format
    /(password|secret|key|token|auth)/i, // Contains sensitive keywords
  ];

  return secretPatterns.some((pattern) => pattern.test(value));
}

/**
 * Security utility: Redact sensitive values for logging
 * Use this when logging configuration or debugging
 */
export function redactSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 8) return '***';

  const start = value.slice(0, 4);
  const end = value.slice(-4);
  const middle = '*'.repeat(Math.min(value.length - 8, 20));

  return `${start}${middle}${end}`;
}

/**
 * Get safe environment configuration for logging/debugging
 * This redacts sensitive values to prevent accidental exposure
 */
export function getSafeEnvForLogging(): Record<string, string> {
  return {
    VITE_SUPABASE_PROJECT_ID: env.VITE_SUPABASE_PROJECT_ID,
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: redactSecret(env.VITE_SUPABASE_PUBLISHABLE_KEY),
    NODE_ENV: import.meta.env.MODE,
  };
}
