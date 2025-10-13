/**
 * Admin Data Hooks
 *
 * TanStack Query hooks for fetching and managing admin data.
 * Provides optimized caching, loading states, and error handling.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  AdminUserProfile,
  AdminCareRelationship,
  AdminAlert,
  AdminActivityLog,
  AdminDashboardStats,
  CreateUserInput,
  UpdateUserInput,
  CreateRelationshipInput,
  UpdateRelationshipInput,
  ResolveAlertInput,
  UserFilterOptions,
  AlertFilterOptions,
  RelationshipFilterOptions,
  ActivityLogFilterOptions,
} from '@/lib/admin/types';
import type { Tables } from '@/integrations/supabase/types';

/**
 * Query Keys
 */
export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  usersList: (filters: UserFilterOptions) => [...adminKeys.users(), filters] as const,
  user: (id: string) => [...adminKeys.users(), id] as const,
  relationships: () => [...adminKeys.all, 'relationships'] as const,
  relationshipsList: (filters: RelationshipFilterOptions) =>
    [...adminKeys.relationships(), filters] as const,
  relationship: (id: string) => [...adminKeys.relationships(), id] as const,
  alerts: () => [...adminKeys.all, 'alerts'] as const,
  alertsList: (filters: AlertFilterOptions) => [...adminKeys.alerts(), filters] as const,
  alert: (id: string) => [...adminKeys.alerts(), id] as const,
  activityLog: () => [...adminKeys.all, 'activityLog'] as const,
  activityLogList: (filters: ActivityLogFilterOptions) =>
    [...adminKeys.activityLog(), filters] as const,
};

/**
 * Dashboard Statistics Hook
 */
export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async (): Promise<AdminDashboardStats> => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Fetch all stats in parallel
      const [
        { count: totalUsers },
        { count: activeSeniors },
        { count: activeCaregivers },
        { count: totalAlerts },
        { count: activeAlerts },
        { count: criticalAlerts },
        { count: totalCheckIns },
        { count: checkInsToday },
        { count: totalCareRelationships },
        { count: pendingRelationships },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'senior'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'caregiver'),
        supabase.from('alerts').select('*', { count: 'exact', head: true }),
        supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .eq('severity', 'critical')
          .eq('status', 'active'),
        supabase.from('check_ins').select('*', { count: 'exact', head: true }),
        supabase
          .from('check_ins')
          .select('*', { count: 'exact', head: true })
          .gte('started_at', `${today}T00:00:00`)
          .lte('started_at', `${today}T23:59:59`),
        supabase.from('care_relationships').select('*', { count: 'exact', head: true }),
        supabase
          .from('care_relationships')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

      const systemHealth =
        (criticalAlerts || 0) > 5
          ? 'critical'
          : (activeAlerts || 0) > 20 || (criticalAlerts || 0) > 2
            ? 'warning'
            : 'healthy';

      return {
        totalUsers: totalUsers || 0,
        activeSeniors: activeSeniors || 0,
        activeCaregivers: activeCaregivers || 0,
        totalAlerts: totalAlerts || 0,
        activeAlerts: activeAlerts || 0,
        criticalAlerts: criticalAlerts || 0,
        totalCheckIns: totalCheckIns || 0,
        checkInsToday: checkInsToday || 0,
        totalCareRelationships: totalCareRelationships || 0,
        pendingRelationships: pendingRelationships || 0,
        systemHealth,
        lastUpdated: new Date().toISOString(),
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Users List Hook
 */
export function useAdminUsers(filters: UserFilterOptions = {}) {
  return useQuery({
    queryKey: adminKeys.usersList(filters),
    queryFn: async (): Promise<AdminUserProfile[]> => {
      let query = supabase.from('profiles').select('*');

      // Apply filters
      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      if (filters.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Single User Hook
 */
export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminKeys.user(id),
    queryFn: async (): Promise<AdminUserProfile> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

/**
 * Create User Mutation
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUserInput) => {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: input.email,
        email_confirm: true,
        user_metadata: {
          full_name: input.full_name,
          role: input.role,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: input.email,
          full_name: input.full_name,
          display_name: input.display_name || null,
          role: input.role,
          phone_number: input.phone_number || null,
          date_of_birth: input.date_of_birth || null,
          emergency_contact_name: input.emergency_contact_name || null,
          emergency_contact_phone: input.emergency_contact_phone || null,
        })
        .select()
        .single();

      if (profileError) throw profileError;
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

/**
 * Update User Mutation
 */
export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateUserInput) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.user(id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

/**
 * Care Relationships List Hook
 */
export function useAdminRelationships(filters: RelationshipFilterOptions = {}) {
  return useQuery({
    queryKey: adminKeys.relationshipsList(filters),
    queryFn: async (): Promise<AdminCareRelationship[]> => {
      let query = supabase
        .from('care_relationships')
        .select(
          `
          *,
          patient:profiles!care_relationships_patient_id_fkey(id, full_name, email, role),
          caregiver:profiles!care_relationships_caregiver_id_fkey(id, full_name, email, role)
        `
        );

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }

      if (filters.caregiverId) {
        query = query.eq('caregiver_id', filters.caregiverId);
      }

      if (filters.relationshipType) {
        query = query.eq('relationship_type', filters.relationshipType);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Create Relationship Mutation
 */
export function useCreateRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRelationshipInput) => {
      const { data, error } = await supabase
        .from('care_relationships')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.relationships() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

/**
 * Update Relationship Mutation
 */
export function useUpdateRelationship(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateRelationshipInput) => {
      const { data, error } = await supabase
        .from('care_relationships')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.relationship(id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.relationships() });
    },
  });
}

/**
 * Alerts List Hook
 */
export function useAdminAlerts(filters: AlertFilterOptions = {}) {
  return useQuery({
    queryKey: adminKeys.alertsList(filters),
    queryFn: async (): Promise<AdminAlert[]> => {
      let query = supabase
        .from('alerts')
        .select(
          `
          *,
          patient:profiles!alerts_patient_id_fkey(id, full_name, email),
          acknowledged_by_user:profiles!alerts_acknowledged_by_fkey(id, full_name, email)
        `
        );

      // Apply filters
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }

      if (filters.alertType) {
        query = query.eq('alert_type', filters.alertType);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Resolve Alert Mutation
 */
export function useResolveAlert(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ResolveAlertInput) => {
      const { data, error } = await supabase
        .from('alerts')
        .update({
          status: input.status,
          resolution_notes: input.resolution_notes || null,
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.alert(id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.alerts() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

/**
 * Activity Log Hook
 */
export function useAdminActivityLog(filters: ActivityLogFilterOptions = {}) {
  return useQuery({
    queryKey: adminKeys.activityLogList(filters),
    queryFn: async (): Promise<AdminActivityLog[]> => {
      let query = supabase
        .from('activity_log')
        .select(
          `
          *,
          user:profiles!activity_log_user_id_fkey(id, full_name, email, role)
        `
        );

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.activityType) {
        query = query.eq('activity_type', filters.activityType);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters.search) {
        query = query.or(
          `activity_type.ilike.%${filters.search}%,activity_description.ilike.%${filters.search}%`
        );
      }

      // Apply sorting
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order('created_at', { ascending: sortOrder === 'asc' }).limit(100);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
}
