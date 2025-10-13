# Para Connect - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Database Schema](#database-schema)
4. [Supabase Edge Functions](#supabase-edge-functions)
5. [Client API](#client-api)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Security](#security)

---

## Overview

Para Connect uses Supabase as its backend-as-a-service, providing:

- **PostgreSQL Database**: Relational data storage with Row-Level Security
- **Supabase Auth**: JWT-based authentication
- **Edge Functions**: Deno-based serverless functions
- **Realtime**: WebSocket subscriptions (future feature)
- **Storage**: File uploads (future feature)

### Base URLs

```
Development:  https://your-project.supabase.co
Production:   https://your-prod-project.supabase.co
Edge Functions: https://your-project.supabase.co/functions/v1/
```

---

## Authentication

### Overview

Para Connect uses Supabase Auth with JWT tokens for authentication. All authenticated requests include a Bearer token in the Authorization header.

### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'SecurePassword123',
  options: {
    data: {
      full_name: 'John Doe',
      role: 'senior'
    }
  }
});
```

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-10-12T10:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_in": 3600
  }
}
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'SecurePassword123'
});
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

### Get Current Session

```typescript
const { data: { session }, error } = await supabase.auth.getSession();
```

### Refresh Token

Tokens are automatically refreshed by the Supabase client.

---

## Database Schema

### Tables Overview

| Table | Description | RLS Enabled |
|-------|-------------|-------------|
| `profiles` | User profiles extending auth.users | ✅ |
| `care_relationships` | Patient-caregiver connections | ✅ |
| `check_ins` | Conversation history with AI analysis | ✅ |
| `daily_summaries` | Aggregated wellness metrics | ✅ |
| `alerts` | Safety notifications | ✅ |
| `caregiver_notes` | Clinical notes and reminders | ✅ |
| `activity_log` | Audit trail | ✅ |
| `waitlist_signups` | Pre-launch signups | ✅ |

### profiles

User account information.

**Schema**:
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('senior', 'caregiver', 'family_member', 'admin')),
  phone_number TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notification_preferences JSONB DEFAULT '{"email": true, "whatsapp": false, "push": true}'::jsonb,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);
```

**TypeScript Interface**:
```typescript
interface Profile {
  id: string;
  email: string;
  full_name: string;
  display_name?: string;
  role: 'senior' | 'caregiver' | 'family_member' | 'admin';
  phone_number?: string;
  date_of_birth?: string;
  avatar_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notification_preferences: {
    email: boolean;
    whatsapp: boolean;
    push: boolean;
  };
  timezone: string;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}
```

**API Examples**:

```typescript
// Get current user profile
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Update profile
const { data, error } = await supabase
  .from('profiles')
  .update({
    display_name: 'Johnny',
    phone_number: '+1234567890'
  })
  .eq('id', userId);

// Get all caregivers
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'caregiver');
```

### care_relationships

Links patients with caregivers and defines access permissions.

**Schema**:
```sql
CREATE TABLE public.care_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) NOT NULL,
  caregiver_id UUID REFERENCES public.profiles(id) NOT NULL,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('primary_caregiver', 'family_member', 'healthcare_provider', 'friend', 'other')),
  relationship_label TEXT,
  can_view_health_data BOOLEAN DEFAULT true,
  can_receive_alerts BOOLEAN DEFAULT true,
  can_modify_settings BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  invitation_token TEXT UNIQUE,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, caregiver_id)
);
```

**API Examples**:

```typescript
// Get caregiver's patients
const { data, error } = await supabase
  .from('care_relationships')
  .select(`
    *,
    patient:patient_id(id, full_name, avatar_url),
    caregiver:caregiver_id(id, full_name)
  `)
  .eq('caregiver_id', caregiverId)
  .eq('status', 'active');

// Create care relationship
const { data, error } = await supabase
  .from('care_relationships')
  .insert({
    patient_id: patientId,
    caregiver_id: caregiverId,
    relationship_type: 'family_member',
    relationship_label: 'Daughter',
    can_view_health_data: true,
    can_receive_alerts: true
  });
```

### check_ins

Conversation history between seniors and AI companion.

**Schema**:
```sql
CREATE TABLE public.check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('voice', 'text', 'whatsapp', 'scheduled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  messages JSONB DEFAULT '[]'::jsonb,
  sentiment_score DECIMAL(3,2),
  mood_detected TEXT CHECK (mood_detected IN ('happy', 'neutral', 'sad', 'concerned', 'anxious', 'confused')),
  topics_discussed TEXT[],
  safety_concern_detected BOOLEAN DEFAULT false,
  safety_concern_type TEXT,
  safety_concern_details TEXT,
  alert_sent BOOLEAN DEFAULT false,
  alert_sent_at TIMESTAMPTZ,
  commitments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Messages Format**:
```typescript
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// Example messages array
[
  {
    "role": "assistant",
    "content": "Good morning! How are you feeling today?",
    "timestamp": "2025-10-12T09:00:00Z"
  },
  {
    "role": "user",
    "content": "I'm doing well, thank you!",
    "timestamp": "2025-10-12T09:00:15Z"
  }
]
```

**API Examples**:

```typescript
// Get recent check-ins for patient
const { data, error } = await supabase
  .from('check_ins')
  .select('*')
  .eq('patient_id', patientId)
  .order('started_at', { ascending: false })
  .limit(10);

// Create new check-in
const { data, error } = await supabase
  .from('check_ins')
  .insert({
    patient_id: patientId,
    interaction_type: 'text',
    messages: []
  })
  .select()
  .single();

// Update check-in with messages
const { data, error } = await supabase
  .from('check_ins')
  .update({
    messages: updatedMessages,
    ended_at: new Date().toISOString(),
    mood_detected: 'happy',
    sentiment_score: 0.8
  })
  .eq('id', checkInId);
```

### daily_summaries

Aggregated daily wellness metrics for each patient.

**Schema**:
```sql
CREATE TABLE public.daily_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) NOT NULL,
  summary_date DATE NOT NULL,
  check_in_count INTEGER DEFAULT 0,
  total_conversation_minutes INTEGER DEFAULT 0,
  overall_mood TEXT CHECK (overall_mood IN ('happy', 'neutral', 'sad', 'concerned', 'mixed')),
  average_sentiment_score DECIMAL(3,2),
  medication_taken BOOLEAN,
  meals_reported INTEGER DEFAULT 0,
  activity_reported BOOLEAN,
  sleep_quality TEXT CHECK (sleep_quality IN ('good', 'fair', 'poor', 'not_reported')),
  overall_status TEXT NOT NULL DEFAULT 'ok' CHECK (overall_status IN ('ok', 'warning', 'alert')),
  status_reason TEXT,
  summary_text TEXT,
  highlights TEXT[],
  concerns TEXT[],
  alerts_triggered INTEGER DEFAULT 0,
  alert_types TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, summary_date)
);
```

**API Examples**:

```typescript
// Get today's summary
const today = new Date().toISOString().split('T')[0];
const { data, error } = await supabase
  .from('daily_summaries')
  .select('*')
  .eq('patient_id', patientId)
  .eq('summary_date', today)
  .single();

// Get summaries for last 7 days
const { data, error } = await supabase
  .from('daily_summaries')
  .select('*')
  .eq('patient_id', patientId)
  .gte('summary_date', sevenDaysAgo)
  .order('summary_date', { ascending: false });
```

### alerts

Safety alerts and notifications.

**Schema**:
```sql
CREATE TABLE public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) NOT NULL,
  check_in_id UUID REFERENCES public.check_ins(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('fall_detected', 'distress_signal', 'missed_checkin', 'medication_missed', 'prolonged_inactivity', 'health_concern', 'manual')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  alert_message TEXT NOT NULL,
  alert_details JSONB,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_alarm')),
  notified_caregivers UUID[],
  notification_sent_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES public.profiles(id),
  acknowledged_at TIMESTAMPTZ,
  resolution_notes TEXT,
  escalation_countdown_started BOOLEAN DEFAULT false,
  escalation_countdown_end TIMESTAMPTZ,
  escalated BOOLEAN DEFAULT false,
  escalated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API Examples**:

```typescript
// Get active alerts for patient
const { data, error } = await supabase
  .from('alerts')
  .select(`
    *,
    patient:patient_id(full_name, avatar_url),
    acknowledger:acknowledged_by(full_name)
  `)
  .eq('patient_id', patientId)
  .eq('status', 'active')
  .order('created_at', { ascending: false });

// Create alert
const { data, error } = await supabase
  .from('alerts')
  .insert({
    patient_id: patientId,
    check_in_id: checkInId,
    alert_type: 'health_concern',
    severity: 'medium',
    alert_message: 'Patient reported feeling dizzy',
    alert_details: { symptoms: ['dizziness', 'fatigue'] }
  });

// Acknowledge alert
const { data, error } = await supabase
  .from('alerts')
  .update({
    status: 'acknowledged',
    acknowledged_by: caregiverId,
    acknowledged_at: new Date().toISOString()
  })
  .eq('id', alertId);
```

---

## Supabase Edge Functions

### senior-chat

AI-powered chat endpoint using OpenAI GPT-4o-mini.

**Endpoint**: `POST /functions/v1/senior-chat`

**Authentication**: Required (Bearer token)

**Rate Limit**: 30 requests per minute per user

**Request**:
```typescript
{
  "messages": [
    {
      "role": "user",
      "content": "I took my medication this morning"
    }
  ]
}
```

**Request Schema**:
```typescript
interface SeniorChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}
```

**Response**: Server-Sent Events (SSE) stream

**Example Usage**:

```typescript
import { callSupabaseFunctionStreaming } from '@/lib/supabase-functions';

const response = await callSupabaseFunctionStreaming({
  functionName: 'senior-chat',
  body: {
    messages: [
      { role: 'user', content: 'How are you today?' }
    ]
  }
});

// Read streaming response
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n').filter(line => line.trim());

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') {
        break;
      }
      const parsed = JSON.parse(data);
      const content = parsed.choices[0]?.delta?.content;
      if (content) {
        // Process content
        console.log(content);
      }
    }
  }
}
```

**Security Features**:
- Input validation (Zod schemas)
- Message sanitization (XSS prevention)
- Rate limiting
- Authentication required
- Content type validation

**Error Responses**:

```typescript
// 400 Bad Request
{
  "error": "Validation failed",
  "details": [
    { "field": "messages", "message": "Required" }
  ]
}

// 401 Unauthorized
{
  "error": "Authentication required"
}

// 429 Too Many Requests
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}

// 500 Internal Server Error
{
  "error": "AI service error"
}
```

---

## Client API

### Supabase Client Wrapper

Use the configured Supabase client:

```typescript
import { supabase } from '@/integrations/supabase/client';
```

### Secure Function Calling

Use the secure wrapper to call Edge Functions:

```typescript
import { callSupabaseFunction, callSupabaseFunctionStreaming } from '@/lib/supabase-functions';

// Non-streaming call
const response = await callSupabaseFunction({
  functionName: 'my-function',
  body: { data: 'value' }
});

// Streaming call
const response = await callSupabaseFunctionStreaming({
  functionName: 'senior-chat',
  body: { messages: [...] }
});
```

**Benefits**:
- Automatic session token handling
- No Bearer token exposure
- Proper error handling
- TypeScript types

### React Query Hooks

Create reusable hooks for data fetching:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch hook
export function useProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

// Mutation hook
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Partial<Profile>) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', profile.id!)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', data.id] });
    },
  });
}
```

---

## Error Handling

### Error Response Format

All API errors follow this format:

```typescript
interface ApiError {
  error: string;           // Error message
  code?: string;           // Error code
  details?: any;           // Additional details
  statusCode: number;      // HTTP status code
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `PGRST301` | 400 | Bad request - invalid parameters |
| `PGRST116` | 401 | Unauthorized - authentication required |
| `PGRST204` | 403 | Forbidden - insufficient permissions |
| `PGRST116` | 404 | Not found - resource doesn't exist |
| `23505` | 409 | Conflict - unique constraint violation |
| `42501` | 403 | RLS policy violation |

### Error Handling Pattern

```typescript
try {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    // Handle Supabase error
    if (error.code === 'PGRST116') {
      // Not found or unauthorized
      console.error('Profile not found or unauthorized');
    } else if (error.code === '42501') {
      // RLS policy violation
      console.error('Access denied');
    } else {
      // Other errors
      console.error('Database error:', error.message);
    }
    throw error;
  }

  return data;
} catch (err) {
  // Handle unexpected errors
  console.error('Unexpected error:', err);
  throw err;
}
```

---

## Rate Limiting

### Client-Side Rate Limiting

Rate limiting is implemented in the application layer:

```typescript
import { checkRateLimit, RATE_LIMITS } from '@/lib/validation/rate-limiting';

// Check rate limit
const rateLimit = checkRateLimit('action_name', userId, RATE_LIMITS.CHAT_MESSAGE);

if (!rateLimit.allowed) {
  const waitSeconds = Math.ceil(rateLimit.resetIn / 1000);
  throw new Error(`Rate limit exceeded. Please wait ${waitSeconds} seconds.`);
}

// Proceed with action
```

### Rate Limit Configuration

```typescript
export const RATE_LIMITS = {
  // Authentication
  LOGIN_ATTEMPT: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  SIGNUP_ATTEMPT: { maxRequests: 3, windowMs: 60 * 60 * 1000 },

  // API calls
  CHAT_MESSAGE: { maxRequests: 30, windowMs: 60 * 1000 },
  NOTE_CREATE: { maxRequests: 20, windowMs: 60 * 1000 },
  PROFILE_UPDATE: { maxRequests: 5, windowMs: 60 * 1000 },
  API_CALL: { maxRequests: 100, windowMs: 60 * 1000 },
};
```

### Server-Side Rate Limiting

Edge Functions implement rate limiting:

```typescript
// In Edge Function
const rateLimit = checkRateLimit(userId, 30, 60000); // 30 req/min

if (!rateLimit.allowed) {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil(rateLimit.resetIn / 1000)
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil(rateLimit.resetIn / 1000))
      }
    }
  );
}
```

---

## Security

### Input Validation

All inputs are validated using Zod schemas:

```typescript
import { z } from 'zod';

export const chatMessageSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(2000)
    })
  ).min(1).max(100)
});

// Validate input
const result = chatMessageSchema.safeParse(input);
if (!result.success) {
  throw new Error('Validation failed');
}
```

### Input Sanitization

All user inputs are sanitized:

```typescript
import { sanitizeChatMessage } from '@/lib/validation/sanitization';

const clean = sanitizeChatMessage(userInput);
// Removes HTML, limits length, prevents XSS
```

### Row-Level Security (RLS)

All database tables have RLS policies:

```sql
-- Users can only view their own profile
CREATE POLICY "users_view_own_profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Caregivers can view patient data
CREATE POLICY "caregivers_view_patients"
ON public.check_ins FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.care_relationships
    WHERE patient_id = check_ins.patient_id
    AND caregiver_id = auth.uid()
    AND status = 'active'
    AND can_view_health_data = true
  )
);
```

### Authentication

All API calls require authentication:

```typescript
// Automatic authentication with Supabase client
const { data, error } = await supabase
  .from('profiles')
  .select('*');  // Automatically includes auth token

// Manual authentication for Edge Functions
const token = (await supabase.auth.getSession()).data.session?.access_token;
fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## API Versioning

Currently using implicit v1. Future versions will be explicitly versioned:

```
/functions/v1/senior-chat  (current)
/functions/v2/senior-chat  (future)
```

---

## Additional Resources

- **Supabase Documentation**: https://supabase.com/docs
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **OpenAI API Reference**: https://platform.openai.com/docs/api-reference
- **Row-Level Security Guide**: [RLS_POLICIES_DOCUMENTATION.md](/workspace/para-kind-connect-local/supabase/migrations/RLS_POLICIES_DOCUMENTATION.md)

---

**Document Version**: 1.0.0
**Last Updated**: October 12, 2025
**Maintained By**: Para Connect Development Team
