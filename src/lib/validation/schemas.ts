/**
 * Zod Validation Schemas
 *
 * Comprehensive validation schemas for all data models in Parra Connect.
 * These schemas enforce strong typing, input validation, and data integrity.
 *
 * Security Features:
 * - Input length limits to prevent DoS attacks
 * - Email format validation
 * - Phone number validation
 * - String trimming and normalization
 * - Enum validation for constrained values
 * - UUID validation for IDs
 * - Date validation and constraints
 * - SQL injection prevention through type validation
 *
 * @module validation/schemas
 */

import { z } from 'zod';

/**
 * Common validation patterns
 */

// Email validation with strict RFC compliance
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase();

// Password validation with strong security requirements
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .refine((val) => !/\s/.test(val), 'Password cannot contain spaces');

// Phone number validation (international format)
export const phoneNumberSchema = z
  .string()
  .trim()
  .regex(
    /^\+?[1-9]\d{1,14}$/,
    'Invalid phone number format. Use international format (e.g., +1234567890)'
  )
  .optional()
  .or(z.literal(''));

// UUID validation for IDs
export const uuidSchema = z
  .string()
  .uuid('Invalid ID format');

// Name validation (alphanumeric, spaces, hyphens, apostrophes)
export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(
    /^[a-zA-Z\s\-']+$/,
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  );

// Display name validation (more flexible)
export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name must be at least 1 character')
  .max(50, 'Display name must be less than 50 characters')
  .regex(
    /^[a-zA-Z0-9\s\-_']+$/,
    'Display name can only contain letters, numbers, spaces, hyphens, underscores, and apostrophes'
  )
  .optional()
  .or(z.literal(''));

// Text content validation (general purpose)
export const textContentSchema = z
  .string()
  .trim()
  .min(1, 'Content is required')
  .max(10000, 'Content must be less than 10,000 characters');

// Note text validation (for caregiver notes, etc.)
export const noteTextSchema = z
  .string()
  .trim()
  .min(1, 'Note is required')
  .max(5000, 'Note must be less than 5,000 characters');

// Chat message validation
export const chatMessageSchema = z
  .string()
  .trim()
  .min(1, 'Message cannot be empty')
  .max(2000, 'Message must be less than 2,000 characters');

/**
 * User Role Schemas
 */

export const userRoleSchema = z.enum(['senior', 'caregiver', 'family_member', 'admin'], {
  errorMap: () => ({ message: 'Invalid user role' }),
});

export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * Authentication Schemas
 */

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Signup schema
export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    fullName: nameSchema,
    displayName: displayNameSchema,
    phoneNumber: phoneNumberSchema,
    role: userRoleSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignupInput = z.infer<typeof signupSchema>;

/**
 * Profile Schemas
 */

export const profileSchema = z.object({
  id: uuidSchema,
  email: emailSchema,
  fullName: nameSchema,
  displayName: displayNameSchema,
  phoneNumber: phoneNumberSchema,
  role: userRoleSchema,
  avatarUrl: z.string().url().optional().or(z.literal('')),
  bio: z
    .string()
    .trim()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  emergencyContact: z
    .string()
    .trim()
    .max(200, 'Emergency contact must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  preferences: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Profile = z.infer<typeof profileSchema>;

// Profile update schema (partial, for updates)
export const profileUpdateSchema = profileSchema
  .omit({ id: true, email: true, createdAt: true, updatedAt: true })
  .partial();

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

/**
 * Chat Message Schemas
 */

export const messageRoleSchema = z.enum(['user', 'assistant', 'system'], {
  errorMap: () => ({ message: 'Invalid message role' }),
});

export const chatMessageObjectSchema = z.object({
  role: messageRoleSchema,
  content: chatMessageSchema,
  timestamp: z.string().datetime().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageObjectSchema>;

export const chatMessagesArraySchema = z
  .array(chatMessageObjectSchema)
  .min(1, 'At least one message is required')
  .max(100, 'Maximum 100 messages allowed per request');

/**
 * Check-In Schemas
 */

export const interactionTypeSchema = z.enum(['text', 'voice'], {
  errorMap: () => ({ message: 'Invalid interaction type' }),
});

export const moodSchema = z.enum(['happy', 'neutral', 'sad', 'concerned', 'anxious', 'angry'], {
  errorMap: () => ({ message: 'Invalid mood value' }),
});

export const statusSchema = z.enum(['ok', 'warning', 'alert'], {
  errorMap: () => ({ message: 'Invalid status value' }),
});

export const checkInSchema = z.object({
  id: uuidSchema.optional(),
  patientId: uuidSchema,
  interactionType: interactionTypeSchema,
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  messages: chatMessagesArraySchema,
  sentimentScore: z.number().min(-1).max(1).nullable().optional(),
  moodDetected: moodSchema.nullable().optional(),
  topicsDiscussed: z.array(z.string().trim().max(100)).max(20).optional(),
  safetyConcernDetected: z.boolean().default(false),
});

export type CheckIn = z.infer<typeof checkInSchema>;

// Check-in creation schema (without id)
export const checkInCreateSchema = checkInSchema.omit({ id: true });

export type CheckInCreate = z.infer<typeof checkInCreateSchema>;

/**
 * Caregiver Note Schemas
 */

export const noteTypeSchema = z.enum(
  ['general', 'medical', 'behavioral', 'emergency', 'activity'],
  {
    errorMap: () => ({ message: 'Invalid note type' }),
  }
);

export const caregiverNoteSchema = z.object({
  id: uuidSchema.optional(),
  patientId: uuidSchema,
  caregiverId: uuidSchema,
  noteType: noteTypeSchema,
  noteText: noteTextSchema,
  sharedWithPatient: z.boolean().default(false),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type CaregiverNote = z.infer<typeof caregiverNoteSchema>;

// Caregiver note creation schema
export const caregiverNoteCreateSchema = caregiverNoteSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CaregiverNoteCreate = z.infer<typeof caregiverNoteCreateSchema>;

/**
 * Alert Schemas
 */

export const alertTypeSchema = z.enum(
  ['safety', 'health', 'emotional', 'missed_checkin', 'system'],
  {
    errorMap: () => ({ message: 'Invalid alert type' }),
  }
);

export const alertSeveritySchema = z.enum(['low', 'medium', 'high', 'critical'], {
  errorMap: () => ({ message: 'Invalid alert severity' }),
});

export const alertSchema = z.object({
  id: uuidSchema.optional(),
  patientId: uuidSchema,
  alertType: alertTypeSchema,
  severity: alertSeveritySchema,
  title: z.string().trim().min(1).max(200, 'Title must be less than 200 characters'),
  message: textContentSchema,
  resolved: z.boolean().default(false),
  resolvedAt: z.string().datetime().nullable().optional(),
  resolvedBy: uuidSchema.nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime().optional(),
});

export type Alert = z.infer<typeof alertSchema>;

// Alert creation schema
export const alertCreateSchema = alertSchema.omit({
  id: true,
  resolved: true,
  resolvedAt: true,
  resolvedBy: true,
  createdAt: true,
});

export type AlertCreate = z.infer<typeof alertCreateSchema>;

/**
 * Care Relationship Schemas
 */

export const relationshipTypeSchema = z.enum(
  ['professional', 'family', 'friend', 'volunteer'],
  {
    errorMap: () => ({ message: 'Invalid relationship type' }),
  }
);

export const relationshipStatusSchema = z.enum(['pending', 'active', 'inactive', 'terminated'], {
  errorMap: () => ({ message: 'Invalid relationship status' }),
});

export const careRelationshipSchema = z.object({
  id: uuidSchema.optional(),
  patientId: uuidSchema,
  caregiverId: uuidSchema,
  relationshipType: relationshipTypeSchema,
  status: relationshipStatusSchema,
  startDate: z.string().datetime(),
  endDate: z.string().datetime().nullable().optional(),
  permissions: z.array(z.string()).default([]),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type CareRelationship = z.infer<typeof careRelationshipSchema>;

// Care relationship creation schema
export const careRelationshipCreateSchema = careRelationshipSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CareRelationshipCreate = z.infer<typeof careRelationshipCreateSchema>;

/**
 * Daily Summary Schemas
 */

export const dailySummarySchema = z.object({
  id: uuidSchema.optional(),
  patientId: uuidSchema,
  summaryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  checkInCount: z.number().int().min(0).max(100),
  overallMood: moodSchema.nullable().optional(),
  overallStatus: statusSchema,
  summaryText: textContentSchema.optional().or(z.literal('')),
  keyTopics: z.array(z.string().trim().max(100)).max(20).optional(),
  concerns: z.array(z.string().trim().max(500)).max(10).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type DailySummary = z.infer<typeof dailySummarySchema>;

/**
 * Edge Function Input Schemas
 */

// Senior chat function input
export const seniorChatInputSchema = z.object({
  messages: chatMessagesArraySchema,
  patientId: uuidSchema.optional(),
  context: z.record(z.unknown()).optional(),
});

export type SeniorChatInput = z.infer<typeof seniorChatInputSchema>;

/**
 * Query Parameter Schemas
 */

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().trim().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type Pagination = z.infer<typeof paginationSchema>;

export const dateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export type DateRange = z.infer<typeof dateRangeSchema>;

/**
 * Validation helper function
 */

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Format Zod errors for user display
 */

export function formatZodErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}

/**
 * Get first error message from Zod error
 */

export function getFirstError(error: z.ZodError): string {
  return error.errors[0]?.message || 'Validation error';
}
