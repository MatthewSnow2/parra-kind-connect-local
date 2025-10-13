/**
 * Admin Utility Functions
 *
 * Helper functions for admin dashboard operations including
 * data formatting, calculations, and common operations.
 */

import type { AdminDashboardStats, RecentActivity } from './types';
import type { Tables } from '@/integrations/supabase/types';

/**
 * Format a date for display in admin tables
 */
export function formatAdminDate(date: string | null): string {
  if (!date) return 'Never';

  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Less than 1 minute
  if (diffMins < 1) return 'Just now';
  // Less than 1 hour
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  // Less than 24 hours
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  // Less than 7 days
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  // Full date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a timestamp with time
 */
export function formatDateTime(date: string | null): string {
  if (!date) return 'N/A';

  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format role for display
 */
export function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    senior: 'Senior',
    caregiver: 'Caregiver',
    family_member: 'Family Member',
    admin: 'Admin',
  };
  return roleMap[role] || role;
}

/**
 * Get role badge color
 */
export function getRoleBadgeVariant(
  role: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    admin: 'destructive',
    caregiver: 'default',
    senior: 'secondary',
    family_member: 'outline',
  };
  return variantMap[role] || 'outline';
}

/**
 * Get alert severity color
 */
export function getAlertSeverityColor(severity: string): string {
  const colorMap: Record<string, string> = {
    low: '#C9EBC0',
    medium: '#FFEBA1',
    high: '#FF8882',
    critical: '#DC2626',
  };
  return colorMap[severity] || '#C9EBC0';
}

/**
 * Get alert status badge variant
 */
export function getAlertStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'destructive',
    acknowledged: 'secondary',
    resolved: 'default',
    false_alarm: 'outline',
  };
  return variantMap[status] || 'outline';
}

/**
 * Get relationship status color
 */
export function getRelationshipStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    active: '#C9EBC0',
    inactive: '#9CA3AF',
    pending: '#FFEBA1',
  };
  return colorMap[status] || '#9CA3AF';
}

/**
 * Calculate system health based on stats
 */
export function calculateSystemHealth(
  stats: Partial<AdminDashboardStats>
): 'healthy' | 'warning' | 'critical' {
  const criticalAlerts = stats.criticalAlerts || 0;
  const activeAlerts = stats.activeAlerts || 0;

  if (criticalAlerts > 5) return 'critical';
  if (activeAlerts > 20 || criticalAlerts > 2) return 'warning';
  return 'healthy';
}

/**
 * Export data to CSV
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns: Array<{ key: keyof T; label: string }>
): void {
  // Create CSV header
  const header = columns.map((col) => col.label).join(',');

  // Create CSV rows
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = item[col.key];
        // Handle values that might contain commas or quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',')
  );

  // Combine header and rows
  const csv = [header, ...rows].join('\n');

  // Create and trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (international)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
}

/**
 * Generate initials from full name
 */
export function getInitials(name: string | null): string {
  if (!name) return '??';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Format large numbers with abbreviations
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Parse activity type to human readable format
 */
export function formatActivityType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get activity icon name based on type
 */
export function getActivityIcon(type: string): string {
  const iconMap: Record<string, string> = {
    user_signup: 'UserPlus',
    user_login: 'LogIn',
    user_logout: 'LogOut',
    alert_created: 'AlertCircle',
    alert_resolved: 'CheckCircle',
    relationship_created: 'Users',
    relationship_updated: 'Users',
    check_in: 'MessageSquare',
    settings_updated: 'Settings',
    profile_updated: 'User',
  };
  return iconMap[type] || 'Activity';
}

/**
 * Sort array by property
 */
export function sortByProperty<T>(
  array: T[],
  property: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return order === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Filter array by search term
 */
export function filterBySearch<T extends Record<string, unknown>>(
  array: T[],
  searchTerm: string,
  searchFields: Array<keyof T>
): T[] {
  if (!searchTerm.trim()) return array;

  const lowerSearch = searchTerm.toLowerCase();
  return array.filter((item) =>
    searchFields.some((field) => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowerSearch);
    })
  );
}

/**
 * Get status indicator color for system health
 */
export function getHealthIndicatorColor(health: 'healthy' | 'warning' | 'critical'): string {
  const colorMap = {
    healthy: '#C9EBC0',
    warning: '#FFEBA1',
    critical: '#FF8882',
  };
  return colorMap[health];
}

/**
 * Format permission label
 */
export function formatPermissionLabel(permission: string): string {
  return permission
    .replace(/^can_/, '')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
