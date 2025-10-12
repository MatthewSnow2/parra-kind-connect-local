/**
 * Secure Supabase Functions API Client
 *
 * This module provides a secure wrapper for calling Supabase Edge Functions.
 * It handles authentication properly using the Supabase client's session management
 * instead of directly exposing API keys in fetch requests.
 *
 * Security benefits:
 * - Uses Supabase client's built-in auth token management
 * - Automatically includes user session tokens when authenticated
 * - No direct exposure of API keys in client code
 * - Proper error handling and type safety
 * - Centralized function calling logic
 */

import { supabase } from '@/integrations/supabase/client';
import { env } from '@/config/env';

/**
 * Generic error class for Supabase function calls
 */
export class SupabaseFunctionError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public functionName?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SupabaseFunctionError';
  }
}

/**
 * Options for calling Supabase Edge Functions
 */
interface FunctionCallOptions<T = unknown> {
  functionName: string;
  body?: T;
  method?: 'POST' | 'GET' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  signal?: AbortSignal; // For cancellation
}

/**
 * Securely call a Supabase Edge Function
 *
 * This function uses the Supabase client to properly handle authentication
 * and authorization. It will automatically include the user's session token
 * if they are authenticated, or use the anon key if not.
 *
 * @param options - Configuration for the function call
 * @returns The response data from the function
 * @throws SupabaseFunctionError if the function call fails
 *
 * @example
 * ```typescript
 * const result = await callSupabaseFunction({
 *   functionName: 'senior-chat',
 *   body: { messages: [...] }
 * });
 * ```
 */
export async function callSupabaseFunction<TRequest = unknown, TResponse = unknown>(
  options: FunctionCallOptions<TRequest>
): Promise<TResponse> {
  const { functionName, body, method = 'POST', headers = {}, signal } = options;

  try {
    // Get the current session to include user auth token if available
    const { data: { session } } = await supabase.auth.getSession();

    // Build the full URL to the function
    const functionUrl = `${env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;

    // Prepare headers with proper authentication
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Use session token if available (authenticated user), otherwise use anon key
    if (session?.access_token) {
      requestHeaders['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // For unauthenticated requests, use the anon key
      // This is safe as it's the public/publishable key
      requestHeaders['Authorization'] = `Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
    }

    // Make the request
    const response = await fetch(functionUrl, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `Function ${functionName} failed with status ${response.status}`;
      let errorDetails: unknown;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorDetails = errorData;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      throw new SupabaseFunctionError(
        errorMessage,
        response.status,
        functionName,
        errorDetails
      );
    }

    // Parse and return the response
    const data = await response.json();
    return data as TResponse;
  } catch (error) {
    // Re-throw SupabaseFunctionError as-is
    if (error instanceof SupabaseFunctionError) {
      throw error;
    }

    // Wrap other errors
    throw new SupabaseFunctionError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      undefined,
      functionName,
      error
    );
  }
}

/**
 * Call a Supabase Edge Function with streaming response
 *
 * This is useful for functions that return streaming data, like chat completions.
 * It properly handles authentication and returns the raw Response object for streaming.
 *
 * @param options - Configuration for the function call
 * @returns The raw Response object for streaming
 * @throws SupabaseFunctionError if the function call fails
 *
 * @example
 * ```typescript
 * const response = await callSupabaseFunctionStreaming({
 *   functionName: 'senior-chat',
 *   body: { messages: [...] }
 * });
 *
 * const reader = response.body?.getReader();
 * // Process streaming data...
 * ```
 */
export async function callSupabaseFunctionStreaming<TRequest = unknown>(
  options: FunctionCallOptions<TRequest>
): Promise<Response> {
  const { functionName, body, method = 'POST', headers = {}, signal } = options;

  try {
    // Get the current session to include user auth token if available
    const { data: { session } } = await supabase.auth.getSession();

    // Build the full URL to the function
    const functionUrl = `${env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;

    // Prepare headers with proper authentication
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Use session token if available (authenticated user), otherwise use anon key
    if (session?.access_token) {
      requestHeaders['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // For unauthenticated requests, use the anon key
      requestHeaders['Authorization'] = `Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}`;
    }

    // Make the request
    const response = await fetch(functionUrl, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `Function ${functionName} failed with status ${response.status}`;
      let errorDetails: unknown;

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        errorDetails = errorData;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }

      throw new SupabaseFunctionError(
        errorMessage,
        response.status,
        functionName,
        errorDetails
      );
    }

    return response;
  } catch (error) {
    // Re-throw SupabaseFunctionError as-is
    if (error instanceof SupabaseFunctionError) {
      throw error;
    }

    // Wrap other errors
    throw new SupabaseFunctionError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      undefined,
      functionName,
      error
    );
  }
}
