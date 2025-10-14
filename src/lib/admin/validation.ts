/**
 * Admin Validation Schemas
 *
 * Zod schemas for validating admin operations including
 * user management, relationships, and system settings.
 */

import { z } from 'zod';
import { emailSchema, phoneNumberSchema, nameSchema, uuidSchema } from '@/lib/validation/schemas';

/**
 * User Management Schemas
 */

export const createUserSchema = z.object({
  email: emailSchema,
  full_name: nameSchema,
  role: z.enum(['senior', 'caregiver', 'family_member', 'admin'], {
    errorMap: () => ({ message: 'Invalid user role' }),
  }),
  display_name: z
    .string()
    .trim()
    .max(50, 'Display name must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  phone_number: phoneNumberSchema.optional(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
  emergency_contact_name: z
    .string()
    .trim()
    .max(100, 'Emergency contact name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  emergency_contact_phone: phoneNumberSchema.optional(),
  sendInvitation: z.boolean().default(false),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  full_name: nameSchema.optional(),
  display_name: z
    .string()
    .trim()
    .max(50, 'Display name must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  role: z.enum(['senior', 'caregiver', 'family_member', 'admin']).optional(),
  phone_number: phoneNumberSchema.optional(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .or(z.literal('')),
  emergency_contact_name: z
    .string()
    .trim()
    .max(100, 'Emergency contact name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  emergency_contact_phone: phoneNumberSchema.optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Care Relationship Schemas
 */

export const createRelationshipSchema = z.object({
  patient_id: uuidSchema,
  caregiver_id: uuidSchema,
  relationship_type: z.enum(['primary_caregiver', 'family_member', 'healthcare_provider', 'friend', 'other'], {
    errorMap: () => ({ message: 'Invalid relationship type' }),
  }),
  relationship_label: z
    .string()
    .trim()
    .max(50, 'Relationship label must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  can_view_health_data: z.boolean().default(true),
  can_receive_alerts: z.boolean().default(true),
  can_modify_settings: z.boolean().default(false),
});

export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>;

export const updateRelationshipSchema = z.object({
  relationship_type: z.enum(['primary_caregiver', 'family_member', 'healthcare_provider', 'friend', 'other']).optional(),
  relationship_label: z
    .string()
    .trim()
    .max(50, 'Relationship label must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  can_view_health_data: z.boolean().optional(),
  can_receive_alerts: z.boolean().optional(),
  can_modify_settings: z.boolean().optional(),
  status: z.enum(['active', 'inactive', 'pending']).optional(),
});

export type UpdateRelationshipInput = z.infer<typeof updateRelationshipSchema>;

/**
 * Alert Management Schemas
 */

export const resolveAlertSchema = z.object({
  status: z.enum(['acknowledged', 'resolved', 'false_alarm'], {
    errorMap: () => ({ message: 'Invalid alert status' }),
  }),
  resolution_notes: z
    .string()
    .trim()
    .max(1000, 'Resolution notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
});

export type ResolveAlertInput = z.infer<typeof resolveAlertSchema>;

/**
 * Filter Schemas
 */

export const userFilterSchema = z.object({
  role: z.enum(['senior', 'caregiver', 'family_member', 'admin']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  search: z.string().trim().max(100).optional(),
  sortBy: z.enum(['created_at', 'last_active_at', 'full_name']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type UserFilterInput = z.infer<typeof userFilterSchema>;

export const alertFilterSchema = z.object({
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['active', 'acknowledged', 'resolved', 'false_alarm']).optional(),
  patientId: uuidSchema.optional(),
  alertType: z.string().trim().max(50).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['created_at', 'severity']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type AlertFilterInput = z.infer<typeof alertFilterSchema>;

export const relationshipFilterSchema = z.object({
  status: z.enum(['active', 'inactive', 'pending']).optional(),
  patientId: uuidSchema.optional(),
  caregiverId: uuidSchema.optional(),
  relationshipType: z.enum(['primary_caregiver', 'family_member', 'healthcare_provider', 'friend', 'other']).optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type RelationshipFilterInput = z.infer<typeof relationshipFilterSchema>;

export const activityLogFilterSchema = z.object({
  userId: uuidSchema.optional(),
  activityType: z.string().trim().max(50).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().trim().max(100).optional(),
  sortBy: z.enum(['created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ActivityLogFilterInput = z.infer<typeof activityLogFilterSchema>;

/**
 * System Settings Schema
 */

export const systemSettingsSchema = z.object({
  // Feature flags
  enableBetaFeatures: z.boolean().default(false),
  enableVoiceCheckins: z.boolean().default(true),
  enableWhatsAppIntegration: z.boolean().default(false),

  // Notification settings
  alertNotificationDelay: z.number().int().min(0).max(60).default(5),
  escalationThreshold: z.number().int().min(1).max(1440).default(30),
  dailySummaryTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').default('08:00'),

  // Security settings
  sessionTimeout: z.number().int().min(15).max(1440).default(60),
  requireMFA: z.boolean().default(false),
  passwordMinLength: z.number().int().min(8).max(128).default(8),

  // System settings
  maintenanceMode: z.boolean().default(false),
  maxCheckInsPerDay: z.number().int().min(1).max(100).default(20),
  dataRetentionDays: z.number().int().min(30).max(3650).default(365),
});

export type SystemSettingsInput = z.infer<typeof systemSettingsSchema>;

/**
 * Validation helper functions
 */

export function validateCreateUser(data: unknown): {
  success: boolean;
  data?: CreateUserInput;
  errors?: z.ZodError;
} {
  try {
    const validatedData = createUserSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

export function validateUpdateUser(data: unknown): {
  success: boolean;
  data?: UpdateUserInput;
  errors?: z.ZodError;
} {
  try {
    const validatedData = updateUserSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

export function validateCreateRelationship(data: unknown): {
  success: boolean;
  data?: CreateRelationshipInput;
  errors?: z.ZodError;
} {
  try {
    const validatedData = createRelationshipSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

export function getValidationErrors(error: z.ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}
