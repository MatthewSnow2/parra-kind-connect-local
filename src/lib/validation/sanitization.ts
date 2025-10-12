/**
 * Input Sanitization Utilities
 *
 * Comprehensive sanitization functions to prevent XSS, injection attacks,
 * and other security vulnerabilities.
 *
 * Security Features:
 * - HTML entity encoding to prevent XSS
 * - Script tag removal
 * - Dangerous attribute removal
 * - SQL injection prevention through parameterization
 * - Path traversal prevention
 * - Control character removal
 * - Unicode normalization
 * - URL sanitization
 *
 * @module validation/sanitization
 */

/**
 * HTML entity encoding map for XSS prevention
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Sanitize HTML content by encoding special characters
 * Prevents XSS attacks by encoding HTML entities
 *
 * @param input - Raw HTML string
 * @returns Sanitized string with encoded HTML entities
 *
 * @example
 * sanitizeHtml('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Remove all HTML tags from input
 * Useful for plain text fields that should never contain markup
 *
 * @param input - String that may contain HTML
 * @returns String with all HTML tags removed
 *
 * @example
 * stripHtmlTags('<p>Hello <strong>World</strong></p>')
 * // Returns: 'Hello World'
 */
export function stripHtmlTags(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Remove dangerous HTML tags and attributes
 * More permissive than stripHtmlTags, allows safe formatting
 *
 * @param input - HTML string
 * @returns String with dangerous tags removed
 */
export function removeDangerousHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // Remove object tags
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');

  // Remove embed tags
  sanitized = sanitized.replace(/<embed\b[^<]*>/gi, '');

  // Remove dangerous event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  return sanitized;
}

/**
 * Sanitize text input for display
 * Combines HTML encoding with whitespace normalization
 *
 * @param input - Raw text input
 * @returns Sanitized text safe for display
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove control characters (except newlines, tabs, carriage returns)
  let sanitized = input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize Unicode (prevent homograph attacks)
  sanitized = sanitized.normalize('NFKC');

  // Trim and normalize whitespace
  sanitized = sanitized.trim().replace(/\s+/g, ' ');

  return sanitized;
}

/**
 * Sanitize chat messages
 * Allows some formatting but removes dangerous content
 *
 * @param message - Raw chat message
 * @returns Sanitized message safe for storage and display
 */
export function sanitizeChatMessage(message: string): string {
  if (typeof message !== 'string') {
    return '';
  }

  // First remove dangerous HTML
  let sanitized = removeDangerousHtml(message);

  // Then sanitize text content
  sanitized = sanitizeText(sanitized);

  // Limit length
  if (sanitized.length > 2000) {
    sanitized = sanitized.substring(0, 2000);
  }

  return sanitized;
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 *
 * @example
 * sanitizeUrl('javascript:alert(1)') // Returns: ''
 * sanitizeUrl('https://example.com') // Returns: 'https://example.com'
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }

  const trimmedUrl = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  for (const protocol of dangerousProtocols) {
    if (trimmedUrl.startsWith(protocol)) {
      return '';
    }
  }

  // Only allow http, https, mailto, tel
  const allowedProtocols = ['http://', 'https://', 'mailto:', 'tel:'];
  const hasAllowedProtocol = allowedProtocols.some((protocol) =>
    trimmedUrl.startsWith(protocol)
  );

  // If no protocol, assume it's a relative URL (safe)
  if (!trimmedUrl.includes(':')) {
    return url.trim();
  }

  // If it has a protocol but not an allowed one, reject it
  if (!hasAllowedProtocol) {
    return '';
  }

  return url.trim();
}

/**
 * Prevent path traversal attacks
 * Removes ../ and .\ patterns from file paths
 *
 * @param path - File path
 * @returns Sanitized path
 */
export function sanitizeFilePath(path: string): string {
  if (typeof path !== 'string') {
    return '';
  }

  // Remove path traversal patterns
  let sanitized = path.replace(/\.\.[/\\]/g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Normalize slashes
  sanitized = sanitized.replace(/\\/g, '/');

  return sanitized;
}

/**
 * Sanitize email address
 * Basic sanitization for email inputs
 *
 * @param email - Email address
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }

  // Remove whitespace and convert to lowercase
  let sanitized = email.trim().toLowerCase();

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return '';
  }

  return sanitized;
}

/**
 * Sanitize phone number
 * Removes non-numeric characters except + at the start
 *
 * @param phone - Phone number
 * @returns Sanitized phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  if (typeof phone !== 'string') {
    return '';
  }

  let sanitized = phone.trim();

  // Keep only + at the start and digits
  if (sanitized.startsWith('+')) {
    sanitized = '+' + sanitized.substring(1).replace(/\D/g, '');
  } else {
    sanitized = sanitized.replace(/\D/g, '');
  }

  return sanitized;
}

/**
 * Sanitize database query input
 * NOTE: This does NOT replace parameterized queries!
 * Always use parameterized queries. This is an additional layer.
 *
 * @param input - Query input
 * @returns Sanitized input
 */
export function sanitizeDatabaseInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove SQL comment patterns
  let sanitized = input.replace(/--/g, '');
  sanitized = sanitized.replace(/\/\*/g, '');
  sanitized = sanitized.replace(/\*\//g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Trim
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitize JSON input
 * Validates and safely parses JSON
 *
 * @param input - JSON string
 * @returns Parsed object or null if invalid
 */
export function sanitizeJson<T = unknown>(input: string): T | null {
  if (typeof input !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(input);
    return parsed as T;
  } catch {
    return null;
  }
}

/**
 * Sanitize object properties recursively
 * Applies text sanitization to all string values in an object
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as T;
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Sanitize user input for search queries
 * Escapes special regex characters
 *
 * @param query - Search query
 * @returns Sanitized query safe for regex
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== 'string') {
    return '';
  }

  // Escape regex special characters
  const sanitized = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return sanitized.trim();
}

/**
 * Allowlist-based sanitization
 * Only allows characters in the specified allowlist
 *
 * @param input - Input string
 * @param allowedChars - Regex pattern of allowed characters
 * @returns Sanitized string with only allowed characters
 *
 * @example
 * sanitizeWithAllowlist('Hello123!@#', /[a-zA-Z0-9]/)
 * // Returns: 'Hello123'
 */
export function sanitizeWithAllowlist(input: string, allowedChars: RegExp): string {
  if (typeof input !== 'string') {
    return '';
  }

  const allowed = input.match(allowedChars);
  return allowed ? allowed.join('') : '';
}

/**
 * Combined sanitization for form inputs
 * Applies appropriate sanitization based on input type
 *
 * @param input - Form input value
 * @param type - Input type
 * @returns Sanitized value
 */
export function sanitizeFormInput(
  input: string,
  type: 'text' | 'email' | 'phone' | 'url' | 'html' | 'search'
): string {
  switch (type) {
    case 'email':
      return sanitizeEmail(input);
    case 'phone':
      return sanitizePhoneNumber(input);
    case 'url':
      return sanitizeUrl(input);
    case 'html':
      return sanitizeHtml(input);
    case 'search':
      return sanitizeSearchQuery(input);
    case 'text':
    default:
      return sanitizeText(input);
  }
}

/**
 * Validate and sanitize UUID
 * Ensures the input is a valid UUID format
 *
 * @param input - Potential UUID
 * @returns Valid UUID or null
 */
export function sanitizeUuid(input: string): string | null {
  if (typeof input !== 'string') {
    return null;
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const trimmed = input.trim();
  if (uuidRegex.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  return null;
}

/**
 * Rate limiting helper - extract and sanitize IP address
 *
 * @param request - Request object
 * @returns Sanitized IP address
 */
export function sanitizeIpAddress(ip: string): string {
  if (typeof ip !== 'string') {
    return '';
  }

  // Remove any non-IP characters
  let sanitized = ip.trim();

  // IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(sanitized)) {
    return sanitized;
  }

  // IPv6 validation (simplified)
  const ipv6Regex = /^([0-9a-f]{0,4}:){7}[0-9a-f]{0,4}$/i;
  if (ipv6Regex.test(sanitized)) {
    return sanitized;
  }

  return '';
}

/**
 * Content Security Policy helper
 * Generate safe inline styles
 *
 * @param styles - CSS styles object
 * @returns Sanitized style string
 */
export function sanitizeInlineStyles(styles: Record<string, string>): string {
  const sanitized: string[] = [];

  for (const [property, value] of Object.entries(styles)) {
    // Remove any javascript: or expression() from values
    if (
      typeof value === 'string' &&
      !value.toLowerCase().includes('javascript:') &&
      !value.toLowerCase().includes('expression(')
    ) {
      // Sanitize property name (alphanumeric and hyphens only)
      const cleanProperty = property.replace(/[^a-z0-9-]/gi, '');
      // Sanitize value (remove potential script injections)
      const cleanValue = value.replace(/[<>'"]/g, '');

      sanitized.push(`${cleanProperty}: ${cleanValue}`);
    }
  }

  return sanitized.join('; ');
}

/**
 * Sanitization error class
 */
export class SanitizationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message);
    this.name = 'SanitizationError';
  }
}
