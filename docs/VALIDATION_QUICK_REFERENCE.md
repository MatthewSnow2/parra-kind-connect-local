# Validation Quick Reference Guide

## Quick Start

### Import What You Need

```typescript
// Schemas
import { loginSchema, signupSchema, chatMessageSchema, noteTextSchema } from '@/lib/validation/schemas';

// Sanitization
import { sanitizeText, sanitizeHtml, sanitizeEmail, sanitizeChatMessage } from '@/lib/validation/sanitization';

// Hooks
import { useValidatedForm, useSecureSubmit } from '@/lib/validation/hooks';

// Rate Limiting
import { checkRateLimit, RATE_LIMITS, recordRateLimitedAction } from '@/lib/validation/rate-limiting';
```

## Common Patterns

### 1. Validate Form Input

```typescript
const form = useValidatedForm({
  schema: loginSchema,
  defaultValues: { email: '', password: '' },
});

<form onSubmit={form.handleSubmit(onSubmit)}>
  <input {...form.register('email')} />
  {form.formState.errors.email && <p>{form.formState.errors.email.message}</p>}
</form>
```

### 2. Validate Single Value

```typescript
const result = chatMessageSchema.safeParse(userInput);
if (!result.success) {
  // Handle error: result.error
} else {
  // Use validated data: result.data
}
```

### 3. Sanitize User Input

```typescript
// Text
const clean = sanitizeText(userInput);

// HTML (encodes entities)
const safe = sanitizeHtml(userInput);

// Chat message (removes HTML, limits length)
const message = sanitizeChatMessage(userInput);

// Email
const email = sanitizeEmail(userInput);
```

### 4. Rate Limiting

```typescript
// Check if allowed
const rateLimit = checkRateLimit('action', userId, RATE_LIMITS.CHAT_MESSAGE);

if (!rateLimit.allowed) {
  throw new Error(`Wait ${Math.ceil(rateLimit.resetIn / 1000)}s`);
}

// Record action
recordRateLimitedAction('action', userId);
```

### 5. Complete Secure Form

```typescript
const { form, handleSubmit, isSubmitting } = useValidatedSecureForm({
  schema: mySchema,
  defaultValues: {},
  onSubmit: async (data) => {
    // Validate
    const sanitized = sanitizeText(data.input);

    // Check rate limit
    const rateLimit = checkRateLimit('action', userId, RATE_LIMITS.NOTE_CREATE);
    if (!rateLimit.allowed) throw new Error('Rate limit');

    // Process
    await processData(sanitized);

    // Record
    recordRateLimitedAction('action', userId);
  },
  onError: (error) => toast.error(error.message),
});
```

## Available Schemas

| Schema | Use Case |
|--------|----------|
| `emailSchema` | Email validation |
| `passwordSchema` | Password with strength requirements |
| `loginSchema` | Login form |
| `signupSchema` | Registration form |
| `chatMessageSchema` | Single chat message |
| `chatMessagesArraySchema` | Array of messages |
| `noteTextSchema` | Caregiver notes |
| `phoneNumberSchema` | Phone numbers |
| `uuidSchema` | UUID validation |

## Available Sanitizers

| Function | Purpose |
|----------|---------|
| `sanitizeText` | Remove control chars, normalize whitespace |
| `sanitizeHtml` | Encode HTML entities (prevents XSS) |
| `stripHtmlTags` | Remove all HTML tags |
| `removeDangerousHtml` | Remove scripts, events, dangerous tags |
| `sanitizeEmail` | Clean and lowercase email |
| `sanitizePhoneNumber` | Extract digits and + |
| `sanitizeChatMessage` | Remove HTML, limit length |
| `sanitizeUrl` | Block javascript:, data: protocols |

## Rate Limits

| Action | Max Attempts | Window |
|--------|-------------|--------|
| `LOGIN` | 5 | 15 min |
| `SIGNUP` | 3 | 1 hour |
| `CHAT_MESSAGE` | 30 | 1 min |
| `NOTE_CREATE` | 20 | 1 min |
| `PROFILE_UPDATE` | 5 | 1 min |
| `API_CALL` | 100 | 1 min |

## Security Checklist

- [ ] Validate all user inputs with Zod schemas
- [ ] Sanitize text before storage and display
- [ ] Check rate limits for sensitive actions
- [ ] Use parameterized queries (Supabase does this)
- [ ] Sanitize error messages (no sensitive data)
- [ ] Validate on both client and server
- [ ] Test with XSS payloads
- [ ] Implement proper authentication
- [ ] Use HTTPS for all requests
- [ ] Enable CORS properly

## XSS Prevention Checklist

- [ ] Never use `dangerouslySetInnerHTML` without sanitizing
- [ ] Sanitize user input before storing
- [ ] Encode output when displaying user content
- [ ] Remove dangerous HTML tags (script, iframe, object)
- [ ] Remove event handlers (onclick, onerror, etc.)
- [ ] Block javascript: and data: URLs
- [ ] Use Content Security Policy headers
- [ ] Validate and sanitize URLs
- [ ] Test with known XSS payloads

## SQL Injection Prevention

✅ Supabase automatically prevents SQL injection by:
- Using parameterized queries
- Properly escaping input
- Row Level Security (RLS)

Still:
- [ ] Never construct raw SQL queries
- [ ] Use Supabase query builder
- [ ] Validate input types
- [ ] Use proper data types in schemas

## Common Mistakes to Avoid

### ❌ Don't

```typescript
// No validation
const result = await supabase.from('table').insert({ data: userInput });

// No sanitization
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// No rate limiting
await expensiveOperation();

// Exposing errors
catch (error) {
  return { error: error.message };
}
```

### ✅ Do

```typescript
// With validation
const validated = schema.parse(userInput);
const sanitized = sanitizeText(validated);
const result = await supabase.from('table').insert({ data: sanitized });

// With sanitization
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userInput) }} />
// Or better:
<div>{userInput}</div> // React auto-escapes

// With rate limiting
const rateLimit = checkRateLimit('action', userId, RATE_LIMITS.API_CALL);
if (rateLimit.allowed) {
  await expensiveOperation();
}

// Sanitized errors
catch (error) {
  console.error('Internal:', error);
  return { error: 'An error occurred' };
}
```

## Testing

### Run Tests

```bash
npm test
```

### Test Single File

```bash
npm test validation.test.ts
```

### Test Coverage

```bash
npm test -- --coverage
```

## Edge Function Validation

```typescript
// Import
import {
  seniorChatInputSchema,
  validateInput,
  sanitizeChatMessage,
} from '../_shared/validation.ts';

// Use
const body = await req.json();
const validation = validateInput(seniorChatInputSchema, body);

if (!validation.success) {
  return new Response(JSON.stringify({ errors: validation.errors }), {
    status: 400,
  });
}

const sanitized = validation.data.messages.map(msg => ({
  ...msg,
  content: sanitizeChatMessage(msg.content),
}));
```

## Troubleshooting

### Issue: "Validation fails but input looks correct"

Check:
1. Whitespace (trim it)
2. Case sensitivity (emails should be lowercase)
3. Length limits
4. Required vs optional fields

### Issue: "Rate limit triggers too early"

Check:
1. Correct action name
2. Correct user identifier
3. Rate limit configuration
4. Multiple rapid requests

### Issue: "XSS still possible"

Check:
1. Using `dangerouslySetInnerHTML`?
2. Sanitizing before storage?
3. Encoding on output?
4. Testing all input points?

## Resources

- Full documentation: `/docs/VALIDATION.md`
- Tests: `/src/lib/validation/__tests__/`
- Schemas: `/src/lib/validation/schemas.ts`
- Sanitization: `/src/lib/validation/sanitization.ts`
- Hooks: `/src/lib/validation/hooks.ts`
- Rate Limiting: `/src/lib/validation/rate-limiting.ts`

## Support

For security issues, contact: security@para-connect.com

For questions, see: [VALIDATION.md](./VALIDATION.md)
