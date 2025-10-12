/**
 * Edge Function Validation Utilities
 *
 * Zod validation schemas and utilities for Deno Edge Functions.
 * This is a simplified version for the Edge Function environment.
 *
 * Security Features:
 * - Input validation
 * - Type safety
 * - Error handling
 * - Length limits
 *
 * @module edge-functions/validation
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/**
 * Message role schema
 */
export const messageRoleSchema = z.enum(["user", "assistant", "system"], {
  errorMap: () => ({ message: "Invalid message role" }),
});

/**
 * Chat message schema
 */
export const chatMessageSchema = z.object({
  role: messageRoleSchema,
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be less than 2,000 characters"),
  timestamp: z.string().datetime().optional(),
});

/**
 * Chat messages array schema
 */
export const chatMessagesArraySchema = z
  .array(chatMessageSchema)
  .min(1, "At least one message is required")
  .max(100, "Maximum 100 messages allowed per request");

/**
 * Senior chat input schema
 */
export const seniorChatInputSchema = z.object({
  messages: chatMessagesArraySchema,
  patientId: z.string().uuid().optional(),
  context: z.record(z.unknown()).optional(),
});

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Validate input data with a Zod schema
 *
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns Validation result with data or errors
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => {
        const path = err.path.join(".");
        return path ? `${path}: ${err.message}` : err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: ["Validation failed"] };
  }
}

/**
 * Sanitize text content
 * Remove control characters and normalize whitespace
 *
 * @param input - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  // Remove control characters (except newlines, tabs, carriage returns)
  let sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // Normalize Unicode
  sanitized = sanitized.normalize("NFKC");

  // Trim and normalize whitespace
  sanitized = sanitized.trim().replace(/\s+/g, " ");

  return sanitized;
}

/**
 * Sanitize chat message content
 *
 * @param message - Message to sanitize
 * @returns Sanitized message
 */
export function sanitizeChatMessage(message: string): string {
  if (typeof message !== "string") {
    return "";
  }

  // Sanitize basic text
  let sanitized = sanitizeText(message);

  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Limit length
  if (sanitized.length > 2000) {
    sanitized = sanitized.substring(0, 2000);
  }

  return sanitized;
}

/**
 * Create a validation error response
 *
 * @param errors - Array of error messages
 * @param status - HTTP status code
 * @returns Response object
 */
export function createValidationErrorResponse(
  errors: string[],
  status: number = 400
): Response {
  return new Response(
    JSON.stringify({
      error: "Validation failed",
      details: errors,
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Extract and validate authorization header
 *
 * @param req - Request object
 * @returns Authorization token or null
 */
export function extractAuthToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Validate request has required authorization
 *
 * @param req - Request object
 * @returns Whether request has valid auth
 */
export function hasValidAuth(req: Request): boolean {
  const token = extractAuthToken(req);
  return token !== null && token.length > 0;
}

/**
 * Create an unauthorized response
 *
 * @returns Response object
 */
export function createUnauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({
      error: "Unauthorized",
      message: "Valid authorization required",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Validate content type is JSON
 *
 * @param req - Request object
 * @returns Whether content type is JSON
 */
export function isJsonRequest(req: Request): boolean {
  const contentType = req.headers.get("Content-Type");
  return contentType?.includes("application/json") ?? false;
}

/**
 * Create invalid content type response
 *
 * @returns Response object
 */
export function createInvalidContentTypeResponse(): Response {
  return new Response(
    JSON.stringify({
      error: "Invalid content type",
      message: "Content-Type must be application/json",
    }),
    {
      status: 415,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Safely parse JSON request body
 *
 * @param req - Request object
 * @returns Parsed JSON or null on error
 */
export async function safelyParseJson<T = unknown>(req: Request): Promise<T | null> {
  try {
    const body = await req.json();
    return body as T;
  } catch {
    return null;
  }
}

/**
 * Rate limiting storage (in-memory for Edge Functions)
 * Note: This is per-instance. For production, use a shared store like Redis.
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple rate limiter for Edge Functions
 *
 * @param key - Rate limit key (e.g., user ID or IP)
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Whether request is allowed
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean up old entries
  if (entry && entry.resetAt < now) {
    rateLimitStore.delete(key);
  }

  // No entry or expired
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetIn: windowMs,
    };
  }

  // Increment count
  entry.count += 1;

  if (entry.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetAt - now,
    };
  }

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetIn: entry.resetAt - now,
  };
}

/**
 * Create rate limit exceeded response
 *
 * @param resetIn - Time until rate limit resets (ms)
 * @returns Response object
 */
export function createRateLimitResponse(resetIn: number): Response {
  const resetInSeconds = Math.ceil(resetIn / 1000);
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      message: `Too many requests. Please try again in ${resetInSeconds} seconds.`,
      retryAfter: resetInSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": resetInSeconds.toString(),
      },
    }
  );
}
