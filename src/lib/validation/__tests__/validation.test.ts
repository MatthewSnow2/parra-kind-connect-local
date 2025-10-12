/**
 * Validation Tests
 *
 * Unit tests for validation schemas and sanitization functions.
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  loginSchema,
  signupSchema,
  chatMessageSchema,
  noteTextSchema,
  phoneNumberSchema,
} from '../schemas';
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeChatMessage,
  sanitizeUrl,
  stripHtmlTags,
  removeDangerousHtml,
} from '../sanitization';

describe('Email Validation', () => {
  it('validates correct email', () => {
    const result = emailSchema.safeParse('user@example.com');
    expect(result.success).toBe(true);
    expect(result.data).toBe('user@example.com');
  });

  it('trims and lowercases email', () => {
    const result = emailSchema.safeParse('  User@Example.COM  ');
    expect(result.success).toBe(true);
    expect(result.data).toBe('user@example.com');
  });

  it('rejects invalid email', () => {
    const result = emailSchema.safeParse('invalid-email');
    expect(result.success).toBe(false);
  });

  it('rejects empty email', () => {
    const result = emailSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('rejects email without domain', () => {
    const result = emailSchema.safeParse('user@');
    expect(result.success).toBe(false);
  });
});

describe('Password Validation', () => {
  it('validates strong password', () => {
    const result = passwordSchema.safeParse('SecurePass123');
    expect(result.success).toBe(true);
  });

  it('rejects password without uppercase', () => {
    const result = passwordSchema.safeParse('securepass123');
    expect(result.success).toBe(false);
  });

  it('rejects password without lowercase', () => {
    const result = passwordSchema.safeParse('SECUREPASS123');
    expect(result.success).toBe(false);
  });

  it('rejects password without number', () => {
    const result = passwordSchema.safeParse('SecurePassword');
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = passwordSchema.safeParse('Pass1');
    expect(result.success).toBe(false);
  });

  it('rejects password with spaces', () => {
    const result = passwordSchema.safeParse('Secure Pass 123');
    expect(result.success).toBe(false);
  });
});

describe('Login Schema', () => {
  it('validates correct login data', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'SecurePass123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({
      password: 'SecurePass123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
    });
    expect(result.success).toBe(false);
  });
});

describe('Signup Schema', () => {
  it('validates correct signup data', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      fullName: 'John Doe',
      displayName: 'John',
      phoneNumber: '+1234567890',
      role: 'senior',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: 'SecurePass123',
      confirmPassword: 'DifferentPass123',
      fullName: 'John Doe',
      role: 'senior',
    });
    expect(result.success).toBe(false);
  });

  it('validates optional fields', () => {
    const result = signupSchema.safeParse({
      email: 'user@example.com',
      password: 'SecurePass123',
      confirmPassword: 'SecurePass123',
      fullName: 'John Doe',
      displayName: '',
      phoneNumber: '',
      role: 'senior',
    });
    expect(result.success).toBe(true);
  });
});

describe('Chat Message Validation', () => {
  it('validates correct message', () => {
    const result = chatMessageSchema.safeParse('Hello, how are you?');
    expect(result.success).toBe(true);
  });

  it('trims whitespace', () => {
    const result = chatMessageSchema.safeParse('  Hello  ');
    expect(result.success).toBe(true);
    expect(result.data).toBe('Hello');
  });

  it('rejects empty message', () => {
    const result = chatMessageSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('rejects too long message', () => {
    const longMessage = 'a'.repeat(2001);
    const result = chatMessageSchema.safeParse(longMessage);
    expect(result.success).toBe(false);
  });
});

describe('Note Text Validation', () => {
  it('validates correct note', () => {
    const result = noteTextSchema.safeParse('Patient is doing well today.');
    expect(result.success).toBe(true);
  });

  it('rejects empty note', () => {
    const result = noteTextSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('rejects too long note', () => {
    const longNote = 'a'.repeat(5001);
    const result = noteTextSchema.safeParse(longNote);
    expect(result.success).toBe(false);
  });
});

describe('Phone Number Validation', () => {
  it('validates international format', () => {
    const result = phoneNumberSchema.safeParse('+1234567890');
    expect(result.success).toBe(true);
  });

  it('validates without plus', () => {
    const result = phoneNumberSchema.safeParse('1234567890');
    expect(result.success).toBe(true);
  });

  it('accepts empty string', () => {
    const result = phoneNumberSchema.safeParse('');
    expect(result.success).toBe(true);
  });
});

describe('HTML Sanitization', () => {
  it('encodes HTML entities', () => {
    const input = '<script>alert("xss")</script>';
    const output = sanitizeHtml(input);
    expect(output).not.toContain('<script>');
    expect(output).toContain('&lt;script&gt;');
  });

  it('encodes quotes', () => {
    const input = 'Test "quotes" and \'apostrophes\'';
    const output = sanitizeHtml(input);
    expect(output).toContain('&quot;');
    expect(output).toContain('&#x27;');
  });

  it('handles empty string', () => {
    expect(sanitizeHtml('')).toBe('');
  });
});

describe('Strip HTML Tags', () => {
  it('removes all HTML tags', () => {
    const input = '<p>Hello <strong>World</strong></p>';
    const output = stripHtmlTags(input);
    expect(output).toBe('Hello World');
  });

  it('removes script tags', () => {
    const input = 'Safe <script>alert(1)</script> text';
    const output = stripHtmlTags(input);
    expect(output).toBe('Safe  text');
  });

  it('handles nested tags', () => {
    const input = '<div><p><span>Nested</span></p></div>';
    const output = stripHtmlTags(input);
    expect(output).toBe('Nested');
  });
});

describe('Remove Dangerous HTML', () => {
  it('removes script tags', () => {
    const input = '<p>Safe</p><script>alert(1)</script>';
    const output = removeDangerousHtml(input);
    expect(output).not.toContain('<script>');
    expect(output).toContain('<p>Safe</p>');
  });

  it('removes event handlers', () => {
    const input = '<div onclick="alert(1)">Click me</div>';
    const output = removeDangerousHtml(input);
    expect(output).not.toContain('onclick');
  });

  it('removes javascript: protocol', () => {
    const input = '<a href="javascript:alert(1)">Link</a>';
    const output = removeDangerousHtml(input);
    expect(output).not.toContain('javascript:');
  });

  it('removes iframe tags', () => {
    const input = '<p>Safe</p><iframe src="evil.com"></iframe>';
    const output = removeDangerousHtml(input);
    expect(output).not.toContain('<iframe>');
  });
});

describe('Text Sanitization', () => {
  it('removes control characters', () => {
    const input = 'Hello\x00\x01World';
    const output = sanitizeText(input);
    expect(output).toBe('Hello World');
  });

  it('normalizes whitespace', () => {
    const input = '  Hello    World  ';
    const output = sanitizeText(input);
    expect(output).toBe('Hello World');
  });

  it('handles empty string', () => {
    expect(sanitizeText('')).toBe('');
  });
});

describe('Email Sanitization', () => {
  it('lowercases and trims email', () => {
    const input = '  User@Example.COM  ';
    const output = sanitizeEmail(input);
    expect(output).toBe('user@example.com');
  });

  it('returns empty for invalid email', () => {
    const output = sanitizeEmail('not-an-email');
    expect(output).toBe('');
  });

  it('removes control characters', () => {
    const input = 'user\x00@example.com';
    const output = sanitizeEmail(input);
    expect(output).toBe('user@example.com');
  });
});

describe('Phone Number Sanitization', () => {
  it('keeps only digits and leading plus', () => {
    const input = '+1 (555) 123-4567';
    const output = sanitizePhoneNumber(input);
    expect(output).toBe('+15551234567');
  });

  it('removes non-numeric characters', () => {
    const input = '555-abc-1234';
    const output = sanitizePhoneNumber(input);
    expect(output).toBe('5551234');
  });

  it('handles empty string', () => {
    expect(sanitizePhoneNumber('')).toBe('');
  });
});

describe('Chat Message Sanitization', () => {
  it('removes HTML tags', () => {
    const input = 'Hello <strong>world</strong>';
    const output = sanitizeChatMessage(input);
    expect(output).toBe('Hello world');
  });

  it('removes dangerous content', () => {
    const input = 'Hello <script>alert(1)</script> world';
    const output = sanitizeChatMessage(input);
    expect(output).not.toContain('<script>');
  });

  it('limits length', () => {
    const input = 'a'.repeat(3000);
    const output = sanitizeChatMessage(input);
    expect(output.length).toBeLessThanOrEqual(2000);
  });
});

describe('URL Sanitization', () => {
  it('allows safe URLs', () => {
    const input = 'https://example.com';
    const output = sanitizeUrl(input);
    expect(output).toBe('https://example.com');
  });

  it('blocks javascript: protocol', () => {
    const input = 'javascript:alert(1)';
    const output = sanitizeUrl(input);
    expect(output).toBe('');
  });

  it('blocks data: protocol', () => {
    const input = 'data:text/html,<script>alert(1)</script>';
    const output = sanitizeUrl(input);
    expect(output).toBe('');
  });

  it('allows relative URLs', () => {
    const input = '/path/to/page';
    const output = sanitizeUrl(input);
    expect(output).toBe('/path/to/page');
  });

  it('allows mailto links', () => {
    const input = 'mailto:user@example.com';
    const output = sanitizeUrl(input);
    expect(output).toBe('mailto:user@example.com');
  });
});

describe('XSS Prevention', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)>',
    'javascript:alert(1)',
    '<iframe src="javascript:alert(1)">',
    '<body onload=alert(1)>',
    '<input onfocus=alert(1) autofocus>',
    '<select onfocus=alert(1) autofocus>',
    '<textarea onfocus=alert(1) autofocus>',
    '<marquee onstart=alert(1)>',
  ];

  xssPayloads.forEach((payload) => {
    it(`prevents XSS payload: ${payload}`, () => {
      const sanitized = removeDangerousHtml(payload);
      expect(sanitized).not.toContain('alert');
      expect(sanitized).not.toContain('script');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('onload');
    });
  });
});
