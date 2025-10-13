# One-Shot Prompt: Production-Ready Healthcare Monitoring Platform

## Objective
Build a complete, production-ready healthcare monitoring web application for seniors with comprehensive security, accessibility, testing, and administrative capabilities.

## Core Application Requirements

### Application Purpose
Create "Para Connect" - a healthcare monitoring platform that enables:
- Seniors to have AI-powered check-in conversations
- Caregivers to monitor patient wellness and respond to alerts
- Family members to stay informed about loved ones
- Administrators to manage the entire system

### User Roles & Capabilities

**Seniors:**
- Chat interface for daily check-ins with conversational AI
- View personal dashboard with mood, activity, and health summaries
- Access conversation history
- Simple, large-touch-target interface optimized for elderly users

**Caregivers/Family Members:**
- Monitor assigned seniors with real-time status indicators
- View daily summaries of patient wellness
- Receive and respond to alerts
- Add notes about patients
- Access historical data and trends

**Administrators:**
- Complete user management (CRUD operations)
- Assign caregivers to patients (care relationship management)
- System-wide alert management and resolution
- Full audit log with export capabilities
- System configuration and feature flags
- Security settings and monitoring

## Technical Architecture

### Frontend Stack
- Modern React framework with TypeScript strict mode
- Component library for consistent, accessible UI
- Client-side routing with role-based protected routes
- Real-time data synchronization
- Responsive design (mobile-first)

### Backend & Database
- Serverless backend with real-time capabilities
- PostgreSQL database with the following schema:
  - **profiles**: User accounts with roles (senior, caregiver, family_member, admin)
  - **care_relationships**: Caregiver-to-patient assignments with permissions
  - **check_ins**: Patient conversation records with AI messages
  - **daily_summaries**: Aggregated daily wellness data per patient
  - **alerts**: System notifications by severity and status
  - **caregiver_notes**: Notes from caregivers about patients
  - **activity_log**: Complete audit trail for compliance
  - **waitlist_signups**: Beta program signups

### AI Integration
- Streaming chat endpoint for senior conversations
- Real-time message processing with conversational context
- Future: sentiment analysis, mood detection, topic extraction

## Critical Implementation Requirements

### 1. Security (HIGHEST PRIORITY)

**Authentication & Authorization:**
- Implement complete JWT-based authentication system
- Role-based access control (RBAC) for all routes
- Protected routes that check user roles before rendering
- Secure session management with automatic token refresh
- Proper logout with full state cleanup

**Database Security:**
- Row-Level Security (RLS) policies on ALL tables ensuring:
  - Users can only access their own data
  - Caregivers can only access assigned patients
  - Admins have elevated but logged access
  - No data leaks between user groups
- HIPAA-compliance ready security model

**Input Security:**
- Runtime validation using schema validation (like Zod)
- Input sanitization to prevent XSS attacks
- SQL injection prevention (parameterized queries)
- Rate limiting on sensitive operations (login, signup, chat)
- Client AND server-side validation

**Environment Security:**
- Secure environment variable handling
- Runtime validation of required config
- No secrets in code or version control
- Proper .env file exclusion from git

**Error Handling:**
- Sanitize error messages (no information leakage)
- User-friendly messages that don't expose internals
- Comprehensive logging for debugging (development only)

### 2. Accessibility (WCAG 2.1 Level AA Minimum)

**Must-Have Features:**
- Skip navigation links on all pages
- Semantic HTML with proper landmarks (nav, main, header, footer)
- ARIA labels on all interactive elements
- Keyboard navigation support throughout
- Focus indicators (3px outline, high contrast)
- Screen reader compatibility
- Color contrast ratios of at least 4.5:1 for text
- Touch targets minimum 44x44px (critical for seniors)
- Reduced motion support (respects prefers-reduced-motion)
- Form labels properly associated with inputs
- Alt text on all images
- Descriptive button text (not just icons)

**Senior-Friendly Enhancements:**
- Large default font size (18px base)
- Extra large touch targets
- High contrast color scheme
- Clear, simple language
- Minimal cognitive load
- Visual status indicators
- Progress indicators for multi-step processes

### 3. Code Quality

**TypeScript:**
- Strict mode enabled (no implicit any, strict null checks)
- Complete type coverage
- Generic types for reusable components
- Type inference from validation schemas
- No type assertions unless absolutely necessary

**React Best Practices:**
- Functional components with hooks
- Custom hooks for reusable logic
- Proper dependency arrays
- Memoization where beneficial
- Error boundaries for graceful failures
- Loading states for async operations
- Optimistic updates where appropriate

**Code Organization:**
- Feature-based folder structure
- Centralized configuration
- Reusable validation library
- Shared utility functions
- Component composition over inheritance
- Single responsibility principle

**Validation & Sanitization:**
- Schema-based validation for all data models
- Reusable validation schemas
- Runtime type checking
- Text sanitization utilities (HTML encoding, XSS prevention)
- Phone/email/URL specific sanitizers
- Client-side validation for UX, server-side for security

### 4. Testing Infrastructure

**Test Coverage:**
- Unit tests for utility functions
- Component tests for UI elements
- Integration tests for user flows
- Test utilities and mock data factories
- Minimum 60% code coverage goal

**Test Setup:**
- Modern testing framework (like Vitest)
- React component testing library
- Mocked external dependencies (database, auth)
- Test environment configuration
- CI/CD pipeline integration

### 5. Performance

**Optimization Goals:**
- Bundle size under 1MB total
- Initial load under 2 seconds
- Time to interactive under 3.5 seconds
- Remove unused dependencies
- Code splitting for routes
- Lazy loading for heavy components

**Monitoring:**
- Core Web Vitals tracking
- Performance metrics collection
- Error tracking ready
- Loading state management

### 6. Documentation

**Required Documentation:**
- PROJECT_OVERVIEW.md - Executive summary, features, architecture
- DEVELOPER_GUIDE.md - Setup, coding standards, contribution guidelines
- API_DOCUMENTATION.md - Database schema, endpoints, authentication
- DEPLOYMENT_GUIDE.md - Environment setup, deployment steps, CI/CD
- TROUBLESHOOTING.md - Common issues, solutions, FAQ
- CHANGELOG.md - Version history and breaking changes
- README.md - Quick start and links to other docs

**Code Documentation:**
- JSDoc comments on all exported functions
- Type documentation
- Complex logic explained
- Security considerations noted
- Example usage in comments

## Feature-Specific Requirements

### Authentication Pages

**Login:**
- Email and password fields with validation
- "Remember me" functionality via session persistence
- Clear error messages (sanitized)
- Rate limiting (5 attempts per 15 minutes)
- Link to signup page
- Password visibility toggle

**Signup:**
- Email, password, full name, role selection
- Password strength requirements (8+ chars, uppercase, lowercase, number)
- Password confirmation matching
- Role selection (senior, caregiver, family_member)
- Terms acceptance checkbox
- Email verification flow
- Rate limiting (3 signups per hour per IP)

### Senior Interface

**Chat Interface:**
- Streaming AI responses with visual feedback
- Large, touch-friendly message bubbles
- Clear timestamp on messages
- Auto-save conversation every 5 messages
- Voice mode option (future)
- Simple "Send" button with icon
- Conversation history accessible

**Senior Dashboard:**
- Today's activity summary
- Mood indicator
- Recent check-ins count
- Quick action buttons (Chat, View History)
- Upcoming reminders or notes from caregivers

### Caregiver Interface

**Dashboard:**
- Patient status indicator (ok, warning, alert)
- Today's interaction count
- Mood indicator
- AI-generated daily summary
- Quick note-taking area with validation
- Action buttons (View History, Start Chat)

**History View:**
- Filterable conversation history
- Date range selector
- Mood trends visualization
- Export capability

### Admin Dashboard

**Main Dashboard:**
- System metrics (total users, active seniors, alerts)
- Recent activity feed (last 50 actions)
- System health indicators
- Quick actions (Create User, View Alerts)
- Auto-refresh every 30 seconds

**User Management:**
- Searchable, sortable table of all users
- Filter by role
- Create new user with role assignment
- Edit user details (name, email, role, phone)
- Deactivate/reactivate accounts
- Pagination for large datasets

**Care Relationships:**
- View all caregiver-patient relationships
- Create new relationships with permission configuration:
  - can_view_health_data
  - can_receive_alerts
  - can_modify_settings
- Approve/reject pending relationships
- Edit relationship permissions
- Filter by status (active, inactive, pending)

**Alert Management:**
- Table of all system alerts with filters:
  - Severity (low, medium, high, critical)
  - Status (active, acknowledged, resolved, false_alarm)
  - Patient
- Acknowledge alerts
- Resolve alerts with notes
- Alert detail modal
- Statistics dashboard

**Audit Log:**
- Complete activity history with:
  - User who performed action
  - Activity type
  - Timestamp
  - IP address
  - Metadata (affected records)
- Search and filter by user, type, date range
- CSV export for compliance
- Pagination with 50 items per page

**System Settings:**
- Feature flags (enable/disable features)
- Notification settings (email, SMS thresholds)
- Security policies (session timeout, password requirements)
- System maintenance mode toggle
- Configuration validation before save

## UI/UX Design Guidelines

### Color Palette
- Primary: Light green (warm, calming)
- Secondary: Deep green (trust, healthcare)
- Accent: Coral (alerts, important actions)
- Background: White
- Text: Deep green with 11:1+ contrast ratio
- Status colors: Green (ok), Yellow (warning), Red (alert)

### Typography
- Heading font: Clean, readable sans-serif
- Body font: Highly legible sans-serif
- Base size: 18px (larger for seniors)
- Line height: 1.6 (good readability)

### Component Patterns
- Cards for grouped content
- Tables for data lists with sorting/filtering
- Dialogs/modals for forms and confirmations
- Toast notifications for success/error feedback
- Badges for status indicators
- Tabs for multi-section interfaces
- Breadcrumbs for navigation hierarchy
- Loading skeletons for async data

### Navigation
- Top navigation bar with logo and user menu
- Hamburger menu for mobile
- Breadcrumbs in admin interface
- Role-based menu items
- Clear logout option
- "Skip to main content" link

## Data Flow Examples

### Senior Check-In Flow:
1. Senior navigates to /senior/chat
2. Protected route checks authentication and role
3. Chat interface loads with greeting from AI
4. Senior types message → validation → sanitization
5. Client calls streaming chat endpoint with auth token
6. AI streams response back token by token
7. Messages auto-saved to check_ins table every 5 messages
8. Check-in includes metadata (duration, mood, topics)
9. Daily summary updated in background

### Caregiver Monitoring Flow:
1. Caregiver logs in with credentials
2. System fetches care_relationships to find assigned patients
3. Dashboard queries today's daily_summary for first patient
4. Real-time status, mood, and interaction count displayed
5. Caregiver adds note → validation → sanitization → saved
6. Activity logged to audit trail with caregiver_id and timestamp

### Admin User Management Flow:
1. Admin navigates to /admin/users
2. Protected route checks admin role
3. Query fetches all profiles with pagination
4. Admin clicks "Create User" → dialog opens
5. Form with validation (email format, password strength, role selection)
6. Submit → create auth user → create profile → log activity
7. Success toast → table refreshes → new user appears
8. All actions logged to activity_log table

## Migration & Deployment Strategy

### Database Setup:
1. Create all tables with proper types and constraints
2. Add indexes on frequently queried columns:
   - profiles: email (unique), role
   - care_relationships: caregiver_id, patient_id, status
   - check_ins: patient_id, started_at
   - daily_summaries: patient_id, summary_date
   - alerts: patient_id, severity, status
3. Implement RLS policies with the security model described above
4. Create database functions for common operations (if needed)
5. Set up automated backups
6. Test policies thoroughly before production

### Environment Configuration:
- Development: Local database, debug mode enabled
- Staging: Cloud database, verbose logging
- Production: Cloud database, minimal logging, monitoring enabled

### CI/CD Pipeline:
- Automated tests on pull requests
- Build verification
- Lint checks (TypeScript, ESLint)
- Accessibility audit (automated tool)
- Deploy to staging on merge to develop branch
- Deploy to production on merge to main branch (with approval)

### Monitoring & Alerting:
- Error tracking service integration
- Performance monitoring
- Uptime monitoring
- Database performance metrics
- User analytics (privacy-respecting)

## Compliance Considerations

### HIPAA Readiness:
- Audit logs for all data access (activity_log table)
- Encryption in transit and at rest
- Access controls (RLS policies)
- User authentication and authorization
- Secure data deletion capabilities
- Breach notification preparation

### GDPR Compliance:
- User data export capability
- Right to deletion (account deactivation)
- Clear privacy policy
- Consent tracking
- Data minimization principle
- Purpose limitation

## Edge Cases & Error Handling

**Network Failures:**
- Retry logic with exponential backoff
- Offline detection with user notification
- Queue actions for retry when connection restored
- Clear error messages about connectivity

**Data Conflicts:**
- Optimistic locking for concurrent updates
- Clear conflict resolution UI
- Last-write-wins with user notification
- Refresh prompts when data is stale

**Invalid States:**
- Graceful degradation
- Error boundaries to catch React errors
- Fallback UI for broken components
- Clear path back to working state

**User Errors:**
- Inline validation with helpful messages
- Prevent invalid form submissions
- Confirmation dialogs for destructive actions
- Undo capability where possible

## Success Criteria

The implementation is complete when:

1. ✅ All 4 user roles have complete, functional interfaces
2. ✅ Authentication works with proper role-based access control
3. ✅ Database has RLS policies protecting all sensitive data
4. ✅ Input validation and sanitization prevents XSS and injection
5. ✅ WCAG 2.1 AA accessibility standards met (95%+)
6. ✅ TypeScript strict mode enabled with no errors
7. ✅ Test coverage above 60% with passing tests
8. ✅ Performance metrics meet targets (bundle < 1MB, load < 2s)
9. ✅ Complete documentation for developers and users
10. ✅ All admin features functional (users, relationships, alerts, audit, settings)
11. ✅ Application deployable to production with one command
12. ✅ Monitoring and logging configured

## Implementation Notes

### Start Here:
1. Set up project with TypeScript and strict mode
2. Configure environment variable handling
3. Implement authentication system (most critical)
4. Set up database with RLS policies
5. Create protected route wrapper
6. Build authentication pages (Login, Signup)
7. Implement senior interface (chat, dashboard)
8. Implement caregiver interface
9. Implement admin dashboard (all 6 sections)
10. Add comprehensive validation and sanitization
11. Implement accessibility features
12. Add testing infrastructure
13. Write documentation
14. Performance optimization
15. Deploy to staging for testing

### Key Dependencies:
- React framework for UI
- TypeScript compiler
- Database client library
- Authentication service
- Schema validation library
- UI component library
- Testing framework
- Build tool
- Linter

### Do NOT Implement Yet:
- Voice chat (marked as TODO)
- Sentiment analysis (marked as TODO)
- Mood detection (marked as TODO)
- Topic extraction (marked as TODO)
- Email notifications (future)
- SMS alerts (future)
- Mobile native apps (future)

## Output Requirements

When implementation is complete, provide:

1. **Codebase** with all features implemented
2. **Documentation** (7 markdown files minimum)
3. **Database migration files** with RLS policies
4. **Test suite** with passing tests
5. **Deployment configuration** ready for production
6. **Environment template** (.env.example)
7. **Git repository** with clear commit history

The final application should be production-ready, secure, accessible, well-tested, and fully documented. It should handle real patient data responsibly with HIPAA-ready security and be senior-friendly with exceptional accessibility.
