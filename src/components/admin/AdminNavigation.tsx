/**
 * AdminNavigation Component
 *
 * Sidebar navigation for admin dashboard with icons and active states.
 * Provides quick access to all admin features.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Link as LinkIcon,
  AlertCircle,
  Activity,
  Settings,
  Shield,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Overview and metrics',
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Manage users and roles',
  },
  {
    label: 'Care Relationships',
    href: '/admin/relationships',
    icon: LinkIcon,
    description: 'Manage care connections',
  },
  {
    label: 'Alerts',
    href: '/admin/alerts',
    icon: AlertCircle,
    description: 'View and manage alerts',
  },
  {
    label: 'Audit Log',
    href: '/admin/audit',
    icon: Activity,
    description: 'System activity history',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'System configuration',
  },
];

interface AdminNavigationProps {
  className?: string;
}

/**
 * AdminNavigation Component
 *
 * Renders a vertical navigation menu for the admin dashboard.
 * Highlights the active page and provides tooltips with descriptions.
 */
export const AdminNavigation: React.FC<AdminNavigationProps> = ({ className }) => {
  const location = useLocation();

  const isActive = (href: string): boolean => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav
      className={cn('space-y-1', className)}
      aria-label="Admin navigation"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
              'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              active
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label={`${item.label}: ${item.description}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon
              className={cn(
                'h-5 w-5 flex-shrink-0',
                active ? 'text-primary-foreground' : 'text-muted-foreground'
              )}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{item.label}</div>
              <div
                className={cn(
                  'text-xs truncate',
                  active ? 'text-primary-foreground/80' : 'text-muted-foreground'
                )}
              >
                {item.description}
              </div>
            </div>
          </Link>
        );
      })}

      {/* Admin Badge */}
      <div
        className="mt-8 px-4 py-3 rounded-lg bg-muted/50 border border-border"
        role="status"
        aria-label="Current role"
      >
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-muted-foreground">Admin Access</span>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavigation;
