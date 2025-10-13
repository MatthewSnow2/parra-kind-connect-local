# Para Connect Admin Dashboard

## Overview

A comprehensive admin dashboard for the Para Connect healthcare monitoring platform. Built with React 18, TypeScript, shadcn/ui components, and TanStack Query for optimal performance and user experience.

## Features

### 1. Admin Dashboard (AdminDashboard.tsx)
- **Key Metrics Display**: Total users, active seniors, caregivers, and alerts
- **System Health Indicator**: Real-time system status with color-coded alerts
- **Recent Activity Feed**: Latest system activities and user actions
- **Active Alerts Widget**: Quick view of pending alerts requiring attention
- **Quick Actions**: Common administrative tasks accessible from the dashboard
- **Auto-refresh**: Statistics update every 30 seconds

### 2. User Management (AdminUsers.tsx)
- **User Table**: Searchable, filterable table of all system users
- **Role Filtering**: Filter by senior, caregiver, family_member, or admin
- **Search**: Find users by name or email
- **Create User**: Add new users with role assignment and profile details
- **Edit User**: Update user information and change roles
- **User Details**: View complete user profile including contact information
- **Validation**: Zod schema validation for all user inputs

### 3. Care Relationships (AdminCareRelationships.tsx)
- **Relationship Management**: View all patient-caregiver connections
- **Create Relationships**: Assign caregivers to patients
- **Permission Control**: Configure view, alert, and modification permissions
- **Approve/Reject**: Handle pending relationship requests
- **Status Filtering**: Filter by active, pending, or inactive status
- **Relationship Types**: Professional, family, friend, or volunteer

### 4. Alert Management (AdminAlerts.tsx)
- **Alert Dashboard**: View all system alerts with filtering
- **Severity Filtering**: Filter by low, medium, high, or critical
- **Status Management**: Acknowledge, resolve, or mark as false alarm
- **Alert Details**: View complete alert information and history
- **Patient Information**: Quick access to patient details
- **Resolution Notes**: Add notes when resolving alerts
- **Critical Alert Warnings**: Prominent display of urgent alerts

### 5. Audit Log (AdminAuditLog.tsx)
- **Activity Tracking**: Complete audit trail of system activities
- **Multi-Filter Support**: Filter by user, activity type, and date range
- **Search Functionality**: Search through activity descriptions
- **CSV Export**: Export audit log for compliance and reporting
- **User Context**: View who performed each action with role information
- **IP Address Tracking**: Security monitoring with IP address logs

### 6. System Settings (AdminSettings.tsx)
- **Feature Flags**: Enable/disable beta features, voice check-ins, WhatsApp integration
- **Notification Settings**: Configure alert delays, escalation thresholds, daily summaries
- **Security Settings**: Session timeout, MFA requirements, password policies
- **System Configuration**: Maintenance mode, check-in limits, data retention
- **Validation**: Real-time validation of all settings
- **Reset to Defaults**: Quick restore of default settings

## Technical Architecture

### File Structure

```
src/
├── pages/admin/
│   ├── AdminDashboard.tsx       # Main dashboard with metrics
│   ├── AdminUsers.tsx            # User management interface
│   ├── AdminCareRelationships.tsx # Relationship management
│   ├── AdminAlerts.tsx           # Alert management system
│   ├── AdminAuditLog.tsx         # Activity log viewer
│   ├── AdminSettings.tsx         # System settings
│   └── index.ts                  # Exports
│
├── components/admin/
│   ├── AdminLayout.tsx           # Layout wrapper with navigation
│   ├── AdminNavigation.tsx       # Sidebar navigation
│   └── index.ts                  # Exports
│
├── hooks/admin/
│   └── useAdminData.ts           # TanStack Query hooks
│
└── lib/admin/
    ├── types.ts                  # TypeScript type definitions
    ├── utils.ts                  # Utility functions
    ├── validation.ts             # Zod validation schemas
    └── index.ts                  # Exports
```

### Key Technologies

- **React 18**: Latest React features and concurrent rendering
- **TypeScript**: Full type safety with strict mode
- **TanStack Query**: Optimized data fetching with caching
- **shadcn/ui**: Beautiful, accessible UI components
- **Zod**: Runtime type validation
- **React Router v6**: Modern routing with nested routes
- **Supabase**: Backend database and authentication

### Data Fetching Strategy

All admin data hooks use TanStack Query for:
- **Automatic Caching**: Reduces API calls
- **Background Refetching**: Keep data fresh
- **Optimistic Updates**: Instant UI feedback
- **Error Handling**: Consistent error states
- **Loading States**: Skeleton loaders for better UX

### Type Safety

Every component uses strict TypeScript types:
- Database types from Supabase schema
- Extended types with computed properties
- Input validation types from Zod schemas
- Props interfaces for all components

## Usage

### Adding to Routes

Update your `App.tsx` or routes configuration:

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  AdminDashboard,
  AdminUsers,
  AdminCareRelationships,
  AdminAlerts,
  AdminAuditLog,
  AdminSettings,
} from '@/pages/admin';

// In your Routes component:
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/users"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminUsers />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/relationships"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminCareRelationships />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/alerts"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminAlerts />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/audit"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminAuditLog />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/settings"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminSettings />
    </ProtectedRoute>
  }
/>
```

### Extending the Admin Dashboard

#### Adding a New Admin Page

1. Create page component in `src/pages/admin/`
2. Use `AdminLayout` wrapper for consistent UI
3. Create necessary hooks in `useAdminData.ts`
4. Add validation schemas if needed
5. Add route to navigation in `AdminNavigation.tsx`
6. Export from `index.ts`

#### Adding New Metrics

Update `useAdminStats` hook in `useAdminData.ts`:

```tsx
export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async (): Promise<AdminDashboardStats> => {
      // Add your new metric query here
      const { count: myNewMetric } = await supabase
        .from('your_table')
        .select('*', { count: 'exact', head: true });

      return {
        // ... existing metrics
        myNewMetric: myNewMetric || 0,
      };
    },
  });
}
```

#### Custom Filters

All list pages support custom filters. Example:

```tsx
const { data: users } = useAdminUsers({
  role: 'caregiver',
  search: 'john',
  sortBy: 'created_at',
  sortOrder: 'desc',
});
```

## Accessibility Features

- **ARIA Labels**: All interactive elements have proper labels
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Semantic HTML and ARIA attributes
- **Focus Management**: Proper focus handling in dialogs and forms
- **Color Contrast**: WCAG AA compliant color schemes
- **Loading States**: Clear loading indicators with announcements

## Security Features

- **Role-Based Access Control**: Admin-only access via `ProtectedRoute`
- **Input Validation**: All inputs validated with Zod schemas
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **XSS Protection**: React's built-in escaping
- **Audit Trail**: Complete activity logging
- **Session Management**: Automatic timeout and refresh

## Performance Optimizations

- **Code Splitting**: Lazy loading of admin pages
- **Query Caching**: Intelligent cache management
- **Optimistic Updates**: Instant UI feedback
- **Debounced Search**: Reduced API calls on search
- **Skeleton Loaders**: Better perceived performance
- **Auto-refresh**: Background updates without blocking UI

## Responsive Design

All admin pages are fully responsive:
- **Mobile**: Simplified layouts with collapsible sections
- **Tablet**: Adaptive grid layouts
- **Desktop**: Full-featured layouts with sidebars
- **Mobile Navigation**: Bottom navigation bar on small screens

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements

Potential features to add:
- Real-time updates via WebSockets
- Advanced analytics dashboard
- Bulk user operations
- Custom report builder
- Email notification templates
- System backup and restore
- Multi-language support
- Dark mode theme

## Contributing

When adding new features:
1. Follow existing component patterns
2. Add TypeScript types for all new code
3. Use Zod for validation
4. Add ARIA labels for accessibility
5. Include loading and error states
6. Update this README with new features

## Support

For issues or questions:
- Review existing code patterns
- Check TypeScript types in `types.ts`
- Review validation schemas in `validation.ts`
- Check TanStack Query documentation for data fetching patterns

## License

Copyright Para Connect. All rights reserved.
