/**
 * AdminDashboard Page
 *
 * Main admin dashboard showing system overview, key metrics,
 * recent activity, and quick actions.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminStats, useAdminActivityLog, useAdminAlerts } from '@/hooks/admin/useAdminData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  UserCheck,
  AlertCircle,
  Activity,
  TrendingUp,
  Link as LinkIcon,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  formatAdminDate,
  formatNumber,
  getHealthIndicatorColor,
  getAlertSeverityColor,
  formatActivityType,
} from '@/lib/admin/utils';

/**
 * Stat Card Component
 */
interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  href?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  href,
}) => {
  const content = (
    <Card className="transition-all duration-200 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color: '#2F4733' }}>
          {typeof value === 'number' ? formatNumber(value) : value}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <div
            className={`flex items-center gap-1 mt-2 text-xs ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
            {trend.value}% from last week
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link to={href} className="block focus:outline-none focus:ring-2 focus:ring-primary rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
};

/**
 * System Health Indicator Component
 */
const SystemHealthIndicator: React.FC<{ health: 'healthy' | 'warning' | 'critical' }> = ({
  health,
}) => {
  const config = {
    healthy: {
      icon: CheckCircle2,
      label: 'System Healthy',
      description: 'All systems operating normally',
      color: '#C9EBC0',
    },
    warning: {
      icon: AlertTriangle,
      label: 'System Warning',
      description: 'Some alerts require attention',
      color: '#FFEBA1',
    },
    critical: {
      icon: AlertCircle,
      label: 'Critical Issues',
      description: 'Immediate attention required',
      color: '#FF8882',
    },
  };

  const { icon: Icon, label, description, color } = config[health];

  return (
    <Card
      className="border-2"
      style={{ borderColor: color, backgroundColor: `${color}20` }}
      role="status"
      aria-live="polite"
    >
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: color }}
          >
            <Icon className="h-6 w-6" style={{ color: '#2F4733' }} aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold" style={{ color: '#2F4733' }}>
              {label}
            </h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Recent Activity Feed Component
 */
const RecentActivityFeed: React.FC = () => {
  const { data: activities, isLoading, error } = useAdminActivityLog({
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>Failed to load activity feed</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const recentActivities = activities?.slice(0, 10) || [];

  return (
    <div className="space-y-3">
      {recentActivities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
      ) : (
        recentActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0"
              aria-hidden="true"
            >
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: '#2F4733' }}>
                {formatActivityType(activity.activity_type)}
              </p>
              {activity.activity_description && (
                <p className="text-sm text-muted-foreground truncate">
                  {activity.activity_description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {activity.user && (
                  <span className="text-xs text-muted-foreground">{activity.user.full_name}</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatAdminDate(activity.created_at)}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

/**
 * Recent Alerts Component
 */
const RecentAlerts: React.FC = () => {
  const { data: alerts, isLoading, error } = useAdminAlerts({
    status: 'active',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>Failed to load alerts</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  const recentAlerts = alerts?.slice(0, 5) || [];

  return (
    <div className="space-y-3">
      {recentAlerts.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-600" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No active alerts</p>
        </div>
      ) : (
        recentAlerts.map((alert) => (
          <div
            key={alert.id}
            className="p-4 rounded-lg border"
            style={{ borderLeftWidth: '4px', borderLeftColor: getAlertSeverityColor(alert.severity) }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: getAlertSeverityColor(alert.severity),
                      color: '#2F4733',
                      borderColor: 'transparent',
                    }}
                  >
                    {alert.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatAdminDate(alert.created_at)}
                  </span>
                </div>
                <p className="text-sm font-medium" style={{ color: '#2F4733' }}>
                  {alert.alert_message}
                </p>
                {alert.patient && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Patient: {alert.patient.full_name}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/admin/alerts?id=${alert.id}`}>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">View alert details</span>
                </Link>
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

/**
 * AdminDashboard Page Component
 */
export const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats();

  return (
    <AdminLayout
      title="Admin Dashboard"
      description="System overview and key metrics"
      breadcrumbs={[{ label: 'Dashboard' }]}
    >
      {/* System Health Alert */}
      {stats && stats.systemHealth !== 'healthy' && (
        <div className="mb-6">
          <SystemHealthIndicator health={stats.systemHealth} />
        </div>
      )}

      {/* Error State */}
      {statsError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Failed to load dashboard statistics. Please refresh the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {statsLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : stats ? (
          <>
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              description="All registered users"
              icon={Users}
              href="/admin/users"
            />
            <StatCard
              title="Active Seniors"
              value={stats.activeSeniors}
              description="Registered senior users"
              icon={UserCheck}
              href="/admin/users?role=senior"
            />
            <StatCard
              title="Active Caregivers"
              value={stats.activeCaregivers}
              description="Registered caregivers"
              icon={UserCheck}
              href="/admin/users?role=caregiver"
            />
            <StatCard
              title="Active Alerts"
              value={stats.activeAlerts}
              description={`${stats.criticalAlerts} critical alerts`}
              icon={AlertCircle}
              href="/admin/alerts?status=active"
            />
          </>
        ) : null}
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        {statsLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-20 mb-2" />
                  <Skeleton className="h-3 w-40" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : stats ? (
          <>
            <StatCard
              title="Check-ins Today"
              value={stats.checkInsToday}
              description={`${stats.totalCheckIns} total check-ins`}
              icon={Activity}
            />
            <StatCard
              title="Care Relationships"
              value={stats.totalCareRelationships}
              description={`${stats.pendingRelationships} pending`}
              icon={LinkIcon}
              href="/admin/relationships"
            />
            <StatCard
              title="System Health"
              value={stats.systemHealth.toUpperCase()}
              description="Overall system status"
              icon={CheckCircle2}
            />
          </>
        ) : null}
      </div>

      {/* Activity and Alerts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivityFeed />
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/admin/audit">
                View All Activity
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>Alerts requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentAlerts />
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/admin/alerts">
                View All Alerts
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" asChild>
              <Link to="/admin/users?action=create">
                <Users className="mr-2 h-4 w-4" aria-hidden="true" />
                Create User
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/relationships?action=create">
                <LinkIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                Add Relationship
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/alerts?status=active">
                <AlertCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                Review Alerts
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/settings">
                <Activity className="mr-2 h-4 w-4" aria-hidden="true" />
                System Settings
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminDashboard;
