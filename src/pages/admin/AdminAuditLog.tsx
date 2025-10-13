/**
 * AdminAuditLog Page
 *
 * View system activity log with filtering and export functionality.
 * Provides audit trail for security and compliance.
 */

import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminActivityLog, useAdminUsers } from '@/hooks/admin/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Activity, AlertCircle, Download, Search, Filter, Calendar } from 'lucide-react';
import {
  formatAdminDate,
  formatDateTime,
  formatActivityType,
  formatRole,
  exportToCSV,
} from '@/lib/admin/utils';
import type { AdminActivityLog } from '@/lib/admin/types';

/**
 * Activity Log Filters Component
 */
interface ActivityFiltersProps {
  onUserChange: (userId: string) => void;
  onActivityTypeChange: (type: string) => void;
  onSearchChange: (search: string) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  selectedUser: string;
  selectedActivityType: string;
  searchTerm: string;
  dateFrom: string;
  dateTo: string;
  users: Array<{ id: string; full_name: string | null; email: string }>;
}

const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  onUserChange,
  onActivityTypeChange,
  onSearchChange,
  onDateFromChange,
  onDateToChange,
  selectedUser,
  selectedActivityType,
  searchTerm,
  dateFrom,
  dateTo,
  users,
}) => {
  const activityTypes = [
    'all',
    'user_signup',
    'user_login',
    'user_logout',
    'alert_created',
    'alert_resolved',
    'relationship_created',
    'relationship_updated',
    'check_in',
    'settings_updated',
    'profile_updated',
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          placeholder="Search activity descriptions..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          aria-label="Search activities"
        />
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* User Filter */}
        <Select value={selectedUser} onValueChange={onUserChange}>
          <SelectTrigger aria-label="Filter by user">
            <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.full_name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Activity Type Filter */}
        <Select value={selectedActivityType} onValueChange={onActivityTypeChange}>
          <SelectTrigger aria-label="Filter by activity type">
            <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {activityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type === 'all' ? 'All Types' : formatActivityType(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date From */}
        <div className="relative">
          <Calendar
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="pl-9"
            aria-label="Filter from date"
          />
        </div>

        {/* Date To */}
        <div className="relative">
          <Calendar
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="pl-9"
            aria-label="Filter to date"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * AdminAuditLog Page Component
 */
export const AdminAuditLog: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedActivityType, setSelectedActivityType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { toast } = useToast();

  // Fetch users for filter dropdown
  const { data: users } = useAdminUsers();

  // Fetch activity log with filters
  const { data: activities, isLoading, error } = useAdminActivityLog({
    userId: selectedUser !== 'all' ? selectedUser : undefined,
    activityType: selectedActivityType !== 'all' ? selectedActivityType : undefined,
    search: searchTerm || undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo + 'T23:59:59').toISOString() : undefined,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const handleExport = () => {
    if (!activities || activities.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There are no activities to export.',
        variant: 'destructive',
      });
      return;
    }

    const exportData = activities.map((activity) => ({
      timestamp: formatDateTime(activity.created_at),
      user: activity.user?.full_name || activity.user?.email || 'Unknown',
      user_role: activity.user?.role || 'N/A',
      activity_type: formatActivityType(activity.activity_type),
      description: activity.activity_description || '',
      ip_address: activity.ip_address || 'N/A',
    }));

    exportToCSV(
      exportData,
      `activity-log-${new Date().toISOString().split('T')[0]}.csv`,
      [
        { key: 'timestamp', label: 'Timestamp' },
        { key: 'user', label: 'User' },
        { key: 'user_role', label: 'Role' },
        { key: 'activity_type', label: 'Activity Type' },
        { key: 'description', label: 'Description' },
        { key: 'ip_address', label: 'IP Address' },
      ]
    );

    toast({
      title: 'Export successful',
      description: 'Activity log has been exported to CSV.',
    });
  };

  const handleClearFilters = () => {
    setSelectedUser('all');
    setSelectedActivityType('all');
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters =
    selectedUser !== 'all' ||
    selectedActivityType !== 'all' ||
    searchTerm !== '' ||
    dateFrom !== '' ||
    dateTo !== '';

  return (
    <AdminLayout
      title="Audit Log"
      description="View system activity and user actions"
      breadcrumbs={[{ label: 'Audit Log' }]}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {activities
                ? `${activities.length} activit${activities.length !== 1 ? 'ies' : 'y'} found`
                : 'Loading...'}
            </p>
          </div>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
            <Button onClick={handleExport} disabled={!activities || activities.length === 0}>
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter activity log by user, type, or date range</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFilters
              onUserChange={setSelectedUser}
              onActivityTypeChange={setSelectedActivityType}
              onSearchChange={setSearchTerm}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              selectedUser={selectedUser}
              selectedActivityType={selectedActivityType}
              searchTerm={searchTerm}
              dateFrom={dateFrom}
              dateTo={dateTo}
              users={users || []}
            />
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>Failed to load activity log. Please try again.</AlertDescription>
          </Alert>
        )}

        {/* Activity Log Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>System-wide activity and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Activity Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(activity.created_at)}
                        </TableCell>
                        <TableCell>
                          {activity.user ? (
                            <div>
                              <p className="text-sm font-medium" style={{ color: '#2F4733' }}>
                                {activity.user.full_name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {formatRole(activity.user.role)}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">System</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{formatActivityType(activity.activity_type)}</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm max-w-md">
                            {activity.activity_description || 'No description'}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {activity.ip_address || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
                <p className="text-lg font-medium mb-2">No activity found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? 'Try adjusting your filters to see more results'
                    : 'No activity has been logged yet'}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLog;
