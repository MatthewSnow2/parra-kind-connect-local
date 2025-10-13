/**
 * Admin Type Definitions
 *
 * Comprehensive type definitions for admin dashboard features.
 * Extends base types from Supabase with computed properties and UI state.
 */

import type { Tables } from '@/integrations/supabase/types';

/**
 * Extended Profile Type with Role Information
 */
export type AdminUserProfile = Tables<'profiles'> & {
  // Computed fields
  activeStatus?: 'active' | 'inactive';
  careRelationshipCount?: number;
  lastActivityDate?: string;
};

/**
 * Extended Care Relationship Type
 */
export type AdminCareRelationship = Tables<'care_relationships'> & {
  // Joined data
  patient?: Pick<Tables<'profiles'>, 'id' | 'full_name' | 'email' | 'role'>;
  caregiver?: Pick<Tables<'profiles'>, 'id' | 'full_name' | 'email' | 'role'>;
};

/**
 * Extended Alert Type with User Information
 */
export type AdminAlert = Tables<'alerts'> & {
  // Joined data
  patient?: Pick<Tables<'profiles'>, 'id' | 'full_name' | 'email'>;
  acknowledged_by_user?: Pick<Tables<'profiles'>, 'id' | 'full_name' | 'email'>;
  check_in?: Pick<Tables<'check_ins'>, 'id' | 'started_at' | 'mood_detected'>;
};

/**
 * Extended Activity Log Entry
 */
export type AdminActivityLog = Tables<'activity_log'> & {
  // Joined data
  user?: Pick<Tables<'profiles'>, 'id' | 'full_name' | 'email' | 'role'>;
};

/**
 * Dashboard Statistics
 */
export interface AdminDashboardStats {
  totalUsers: number;
  activeSeniors: number;
  activeCaregivers: number;
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  totalCheckIns: number;
  checkInsToday: number;
  totalCareRelationships: number;
  pendingRelationships: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  lastUpdated: string;
}

/**
 * Recent Activity Item
 */
export interface RecentActivity {
  id: string;
  type: 'user_signup' | 'alert_created' | 'relationship_created' | 'check_in' | 'alert_resolved';
  description: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    role: string;
  };
  severity?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, unknown>;
}

/**
 * User Filter Options
 */
export interface UserFilterOptions {
  role?: string;
  status?: 'active' | 'inactive';
  search?: string;
  sortBy?: 'created_at' | 'last_active_at' | 'full_name';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Alert Filter Options
 */
export interface AlertFilterOptions {
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'active' | 'acknowledged' | 'resolved' | 'false_alarm';
  patientId?: string;
  alertType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'created_at' | 'severity';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Care Relationship Filter Options
 */
export interface RelationshipFilterOptions {
  status?: 'active' | 'inactive' | 'pending';
  patientId?: string;
  caregiverId?: string;
  relationshipType?: string;
  search?: string;
}

/**
 * Activity Log Filter Options
 */
export interface ActivityLogFilterOptions {
  userId?: string;
  activityType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: 'created_at';
  sortOrder?: 'asc' | 'desc';
}

/**
 * System Settings
 */
export interface SystemSettings {
  // Feature flags
  enableBetaFeatures: boolean;
  enableVoiceCheckins: boolean;
  enableWhatsAppIntegration: boolean;

  // Notification settings
  alertNotificationDelay: number; // minutes
  escalationThreshold: number; // minutes
  dailySummaryTime: string; // HH:MM format

  // Security settings
  sessionTimeout: number; // minutes
  requireMFA: boolean;
  passwordMinLength: number;

  // System settings
  maintenanceMode: boolean;
  maxCheckInsPerDay: number;
  dataRetentionDays: number;
}

/**
 * Pagination Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  success: boolean;
}

/**
 * User Creation Input
 */
export interface CreateUserInput {
  email: string;
  full_name: string;
  role: 'senior' | 'caregiver' | 'family_member' | 'admin';
  display_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  sendInvitation?: boolean;
}

/**
 * User Update Input
 */
export interface UpdateUserInput {
  full_name?: string;
  display_name?: string;
  role?: 'senior' | 'caregiver' | 'family_member' | 'admin';
  phone_number?: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

/**
 * Create Care Relationship Input
 */
export interface CreateRelationshipInput {
  patient_id: string;
  caregiver_id: string;
  relationship_type: string;
  relationship_label?: string;
  can_view_health_data?: boolean;
  can_receive_alerts?: boolean;
  can_modify_settings?: boolean;
}

/**
 * Update Care Relationship Input
 */
export interface UpdateRelationshipInput {
  relationship_type?: string;
  relationship_label?: string;
  can_view_health_data?: boolean;
  can_receive_alerts?: boolean;
  can_modify_settings?: boolean;
  status?: 'active' | 'inactive' | 'pending';
}

/**
 * Resolve Alert Input
 */
export interface ResolveAlertInput {
  status: 'acknowledged' | 'resolved' | 'false_alarm';
  resolution_notes?: string;
}
