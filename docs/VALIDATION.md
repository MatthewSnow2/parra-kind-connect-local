# Input Validation and Security Documentation

## Overview

Para Connect uses comprehensive input validation and sanitization to prevent security vulnerabilities including XSS, SQL injection, and data corruption. This document outlines the validation system architecture and usage.

## Table of Contents

1. [Architecture](#architecture)
2. [Validation Schemas](#validation-schemas)
3. [Sanitization](#sanitization)
4. [Form Validation](#form-validation)
5. [Rate Limiting](#rate-limiting)
6. [Edge Function Validation](#edge-function-validation)
7. [Security Best Practices](#security-best-practices)
8. [Examples](#examples)

## Architecture

### Core Components

```
src/lib/validation/
├── schemas.ts          # Zod validation schemas
├── sanitization.ts     # Input sanitization functions
├── hooks.ts            # React form validation hooks
├── rate-limiting.ts    # Rate limiting utilities
└── index.ts            # Entry point
```

### Security Layers

1. **Client-Side Validation**: Immediate feedback using Zod schemas
2. **Sanitization**: XSS and injection prevention
3. **Rate Limiting**: Brute force and spam protection
4. **Server-Side Validation**: Edge Functions validate all inputs
5. **Database Protection**: Supabase RLS + parameterized queries

## Validation Schemas

### Available Schemas

#### Authentication

```typescript
import { loginSchema, signupSchema } from '@/lib/validation/schemas';

// Login validation
const loginData = loginSchema.parse({
  email: 'user@example.com',
  password: 'SecurePass123',
});

// Signup validation
const signupData = signupSchema.parse({
  email: 'user@example.com',
  password: 'SecurePass123',
  confirmPassword: 'SecurePass123',
  fullName: 'John Doe',
  displayName: 'John',
  phoneNumber: '+1234567890',
  role: 'senior',
});
```

#### Chat Messages

```typescript
import { chatMessageSchema, chatMessagesArraySchema } from '@/lib/validation/schemas';

// Single message
const message = chatMessageSchema.parse({
  role: 'user',
  content: 'Hello, how are you?',
  timestamp: new Date().toISOString(),
});

// Array of messages
const messages = chatMessagesArraySchema.parse([
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' },
]);
```

#### Notes

```typescript
import { noteTextSchema, caregiverNoteCreateSchema } from '@/lib/validation/schemas';

// Note text validation
const noteText = noteTextSchema.parse('Patient is doing well today.');

// Complete note creation
const note = caregiverNoteCreateSchema.parse({
  patientId: 'uuid-here',
  caregiverId: 'uuid-here',
  noteType: 'general',
  noteText: 'Patient is doing well today.',
  sharedWithPatient: true,
  priority: 'medium',
});
```

#### Profiles

```typescript
import { profileSchema, profileUpdateSchema } from '@/lib/validation/schemas';

// Profile update
const updates = profileUpdateSchema.parse({
  fullName: 'John Doe',
  displayName: 'John',
  phoneNumber: '+1234567890',
  bio: 'Living life to the fullest',
});
```

### Custom Validation

```typescript
import { z } from 'zod';

// Create custom schema
const customSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  age: z.number().int().min(0).max(150),
});

// Use in component
const result = customSchema.safeParse(data);
if (result.success) {
  // Use result.data
} else {
  // Handle result.error
}
```

## Sanitization

### Available Functions

#### Text Sanitization

```typescript
import { sanitizeText, sanitizeHtml, stripHtmlTags } from '@/lib/validation/sanitization';

// Basic text sanitization
const clean = sanitizeText(userInput);

// HTML entity encoding (prevents XSS)
const safe = sanitizeHtml('<script>alert("xss")</script>');
// Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

// Remove all HTML
const plain = stripHtmlTags('<p>Hello <strong>World</strong></p>');
// Returns: 'Hello World'
```

#### Specific Input Types

```typescript
import {
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeUrl,
  sanitizeChatMessage,
} from '@/lib/validation/sanitization';

// Email
const email = sanitizeEmail('  User@Example.COM  ');
// Returns: 'user@example.com'

// Phone number
const phone = sanitizePhoneNumber('+1 (555) 123-4567');
// Returns: '+15551234567'

// URL (blocks javascript:, data:, etc.)
const url = sanitizeUrl('javascript:alert(1)');
// Returns: ''

const safeUrl = sanitizeUrl('https://example.com');
// Returns: 'https://example.com'

// Chat messages
const message = sanitizeChatMessage('Hello <script>alert(1)</script>');
// Returns: 'Hello alert(1)'
```

#### Advanced Sanitization

```typescript
import {
  removeDangerousHtml,
  sanitizeObject,
  sanitizeWithAllowlist,
} from '@/lib/validation/sanitization';

// Remove dangerous HTML but keep safe tags
const html = removeDangerousHtml('<p onclick="steal()">Safe</p><script>bad()</script>');
// Returns: '<p>Safe</p>'

// Sanitize all strings in an object
const obj = sanitizeObject({
  name: '  John Doe  ',
  bio: '<script>xss</script>',
  age: 30,
});
// Returns: { name: 'John Doe', bio: 'xss', age: 30 }

// Allowlist-based sanitization
const alphanumeric = sanitizeWithAllowlist('Hello123!@#', /[a-zA-Z0-9]/g);
// Returns: 'Hello123'
```

## Form Validation

### Using Validation Hooks

#### Basic Form Validation

```typescript
import { useValidatedForm } from '@/lib/validation/hooks';
import { loginSchema } from '@/lib/validation/schemas';

function LoginForm() {
  const form = useValidatedForm({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onSubmit',
  });

  const onSubmit = (data) => {
    // Data is validated and type-safe
    console.log(data.email, data.password);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('email')} />
      {form.formState.errors.email && <p>{form.formState.errors.email.message}</p>}

      <input type="password" {...form.register('password')} />
      {form.formState.errors.password && <p>{form.formState.errors.password.message}</p>}

      <button type="submit">Submit</button>
    </form>
  );
}
```

#### Secure Submit with Rate Limiting

```typescript
import { useValidatedSecureForm } from '@/lib/validation/hooks';
import { loginSchema } from '@/lib/validation/schemas';
import { checkRateLimit, RATE_LIMITS } from '@/lib/validation/rate-limiting';

function LoginForm() {
  const { form, handleSubmit, isSubmitting } = useValidatedSecureForm({
    schema: loginSchema,
    defaultValues: { email: '', password: '' },
    onSubmit: async (data) => {
      // Check rate limit
      const rateLimit = checkRateLimit('login', data.email, RATE_LIMITS.LOGIN);
      if (!rateLimit.allowed) {
        throw new Error(`Too many attempts. Try again in ${rateLimit.resetIn / 1000}s`);
      }

      // Process login
      await signIn(data.email, data.password);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

#### Real-Time Validation

```typescript
import { useRealTimeValidation } from '@/lib/validation/hooks';
import { emailSchema } from '@/lib/validation/schemas';

function EmailInput() {
  const { value, error, onChange, onBlur, isValid } = useRealTimeValidation(emailSchema, '');

  return (
    <div>
      <input value={value} onChange={onChange} onBlur={onBlur} />
      {error && <span className="error">{error}</span>}
      {isValid && <span className="success">Valid email</span>}
    </div>
  );
}
```

## Rate Limiting

### Client-Side Rate Limiting

```typescript
import {
  checkRateLimit,
  recordRateLimitedAction,
  RATE_LIMITS,
  RateLimitError,
} from '@/lib/validation/rate-limiting';

// Check if action is allowed
const result = checkRateLimit('chat_message', userId, RATE_LIMITS.CHAT_MESSAGE);

if (!result.allowed) {
  throw new RateLimitError('Too many messages', result.resetIn, result.remaining);
}

// Record the action
recordRateLimitedAction('chat_message', userId);
```

### Predefined Rate Limits

```typescript
RATE_LIMITS = {
  // Authentication
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },
  SIGNUP: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },

  // Chat
  CHAT_MESSAGE: {
    maxAttempts: 30,
    windowMs: 60 * 1000, // 1 minute
  },

  // Notes
  NOTE_CREATE: {
    maxAttempts: 20,
    windowMs: 60 * 1000, // 1 minute
  },
};
```

### Custom Rate Limiting

```typescript
import { RateLimiter } from '@/lib/validation/rate-limiting';

const customLimiter = new RateLimiter();

const result = customLimiter.check('custom_action', {
  maxAttempts: 10,
  windowMs: 60000,
  blockDurationMs: 300000,
});

if (result.allowed) {
  customLimiter.record('custom_action');
  // Perform action
}
```

## Edge Function Validation

### Senior Chat Example

```typescript
// supabase/functions/senior-chat/index.ts
import {
  seniorChatInputSchema,
  validateInput,
  sanitizeChatMessage,
  checkRateLimit,
} from '../_shared/validation.ts';

serve(async (req) => {
  // Validate input
  const body = await req.json();
  const validation = validateInput(seniorChatInputSchema, body);

  if (!validation.success) {
    return new Response(JSON.stringify({ errors: validation.errors }), {
      status: 400,
    });
  }

  // Sanitize messages
  const sanitizedMessages = validation.data.messages.map((msg) => ({
    ...msg,
    content: sanitizeChatMessage(msg.content),
  }));

  // Process request...
});
```

## Security Best Practices

### 1. Always Validate User Input

```typescript
// ❌ BAD: No validation
const result = await supabase.from('notes').insert({
  note_text: userInput, // Unsafe!
});

// ✅ GOOD: Validate and sanitize
const validation = noteTextSchema.safeParse(userInput);
if (!validation.success) {
  return { error: 'Invalid input' };
}
const sanitized = sanitizeText(validation.data);
const result = await supabase.from('notes').insert({
  note_text: sanitized,
});
```

### 2. Use Parameterized Queries

Supabase automatically uses parameterized queries, preventing SQL injection:

```typescript
// ✅ GOOD: Supabase handles parameterization
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('email', userEmail); // Safe - automatically parameterized
```

### 3. Sanitize Output

```typescript
import { sanitizeHtml } from '@/lib/validation/sanitization';

// When displaying user-generated content
function DisplayNote({ note }: { note: string }) {
  return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(note) }} />;
}

// Or better, just display as text (React auto-escapes)
function DisplayNote({ note }: { note: string }) {
  return <div>{note}</div>; // React handles escaping
}
```

### 4. Implement Rate Limiting

```typescript
// Check before expensive operations
const rateLimit = checkRateLimit('api_call', userId, RATE_LIMITS.API_CALL);
if (!rateLimit.allowed) {
  return { error: 'Rate limit exceeded' };
}

// Record successful action
recordRateLimitedAction('api_call', userId);
```

### 5. Validate File Uploads

```typescript
const fileSchema = z.object({
  name: z.string().max(255),
  size: z.number().max(10 * 1024 * 1024), // 10MB
  type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});
```

### 6. Sanitize Error Messages

```typescript
// ❌ BAD: Exposes internal details
catch (error) {
  return { error: error.message }; // May leak sensitive info
}

// ✅ GOOD: Sanitized error messages
catch (error) {
  console.error('Internal error:', error);
  return { error: 'An error occurred. Please try again.' };
}
```

## Examples

### Complete Login Form with Validation

```typescript
import { useValidatedForm, useSecureSubmit } from '@/lib/validation/hooks';
import { loginSchema } from '@/lib/validation/schemas';
import { sanitizeEmail } from '@/lib/validation/sanitization';
import { checkRateLimit, RATE_LIMITS } from '@/lib/validation/rate-limiting';

export function LoginForm() {
  const form = useValidatedForm({
    schema: loginSchema,
    defaultValues: { email: '', password: '' },
  });

  const { handleSubmit, isSubmitting } = useSecureSubmit({
    onSubmit: async (data) => {
      const sanitizedEmail = sanitizeEmail(data.email);

      // Check rate limit
      const rateLimit = checkRateLimit('login', sanitizedEmail, RATE_LIMITS.LOGIN);
      if (!rateLimit.allowed) {
        throw new Error('Too many login attempts');
      }

      // Record attempt
      recordRateLimitedAction('login', sanitizedEmail);

      // Perform login
      await signIn(sanitizedEmail, data.password);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <input {...form.register('email')} type="email" />
      {form.formState.errors.email && <p>{form.formState.errors.email.message}</p>}

      <input {...form.register('password')} type="password" />
      {form.formState.errors.password && <p>{form.formState.errors.password.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

### Complete Chat Message Handler

```typescript
import { chatMessageSchema } from '@/lib/validation/schemas';
import { sanitizeChatMessage } from '@/lib/validation/sanitization';
import { checkRateLimit, RATE_LIMITS } from '@/lib/validation/rate-limiting';

async function handleSendMessage(input: string, userId: string) {
  // Validate
  const validation = chatMessageSchema.safeParse(input.trim());
  if (!validation.success) {
    throw new Error(validation.error.errors[0].message);
  }

  // Check rate limit
  const rateLimit = checkRateLimit('chat_message', userId, RATE_LIMITS.CHAT_MESSAGE);
  if (!rateLimit.allowed) {
    throw new Error('Sending too fast. Please slow down.');
  }

  // Sanitize
  const sanitized = sanitizeChatMessage(validation.data);

  // Record action
  recordRateLimitedAction('chat_message', userId);

  // Send message
  return await sendToChat(sanitized);
}
```

## Testing Validation

```typescript
import { describe, it, expect } from 'vitest';
import { emailSchema, chatMessageSchema } from '@/lib/validation/schemas';
import { sanitizeHtml, sanitizeChatMessage } from '@/lib/validation/sanitization';

describe('Email Validation', () => {
  it('validates correct email', () => {
    const result = emailSchema.safeParse('user@example.com');
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = emailSchema.safeParse('invalid-email');
    expect(result.success).toBe(false);
  });
});

describe('Sanitization', () => {
  it('prevents XSS attacks', () => {
    const malicious = '<script>alert("xss")</script>';
    const sanitized = sanitizeHtml(malicious);
    expect(sanitized).not.toContain('<script>');
  });

  it('sanitizes chat messages', () => {
    const message = 'Hello <script>bad()</script> world';
    const sanitized = sanitizeChatMessage(message);
    expect(sanitized).toBe('Hello bad() world');
  });
});
```

## Additional Resources

- [Zod Documentation](https://zod.dev/)
- [React Hook Form](https://react-hook-form.com/)
- [OWASP Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

## Summary

The Para Connect validation system provides comprehensive protection against common security vulnerabilities:

- **Zod schemas** for type-safe validation
- **Sanitization functions** for XSS prevention
- **React hooks** for easy form integration
- **Rate limiting** for abuse prevention
- **Edge function validation** for server-side security

Always validate, sanitize, and rate-limit user inputs to maintain application security.
