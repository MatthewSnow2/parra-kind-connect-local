# Para Connect - Developer Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Coding Standards](#coding-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Component Development](#component-development)
8. [State Management](#state-management)
9. [API Integration](#api-integration)
10. [Database Development](#database-development)
11. [Security Best Practices](#security-best-practices)
12. [Performance Optimization](#performance-optimization)
13. [Accessibility Guidelines](#accessibility-guidelines)
14. [Debugging](#debugging)
15. [Contribution Guidelines](#contribution-guidelines)

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.x or v20.x (LTS recommended)
- **npm**: v9.x or higher (comes with Node.js)
- **Git**: v2.x or higher
- **Code Editor**: VS Code recommended with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - GitLens

### Optional Tools

- **Supabase CLI**: For local database development
- **nvm**: Node version manager (recommended)
- **Docker**: For running Supabase locally

### Quick Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd para-kind-connect-local

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local

# Edit .env.local with your credentials:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_PUBLISHABLE_KEY

# 4. Start development server
npm run dev

# 5. Open browser
# Navigate to http://localhost:5173
```

### First Time Setup Checklist

- [ ] Node.js and npm installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env.local`)
- [ ] Development server starts without errors
- [ ] Can access application in browser
- [ ] Tests run successfully (`npm test`)
- [ ] Can create account and login

---

## Development Environment Setup

### VS Code Configuration

#### Recommended Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "eamodio.gitlens",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "usernamehw.errorlens"
  ]
}
```

#### Workspace Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

### Environment Variables

#### Development (`.env.local`)

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# Optional: Override project ID
VITE_SUPABASE_PROJECT_ID=your-project-id
```

#### Production (Set in hosting platform)

```bash
# Same as development, but with production Supabase instance
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-prod-anon-key
```

#### Environment Validation

The application automatically validates environment variables on startup using Zod schemas (`src/config/env.ts`). If validation fails, you'll see clear error messages:

```
❌ Environment variable validation failed:
  - VITE_SUPABASE_URL: Required
  - VITE_SUPABASE_PUBLISHABLE_KEY: Required
```

### Local Supabase Setup (Optional)

For local database development:

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase
supabase init

# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# Create new migration
supabase migration new migration_name
```

---

## Project Structure

### Directory Overview

```
para-kind-connect-local/
├── src/                          # Source code
│   ├── components/               # React components
│   │   ├── ui/                  # shadcn/ui components (DO NOT EDIT)
│   │   └── *.tsx                # Custom components
│   ├── pages/                    # Route components (one per route)
│   ├── contexts/                 # React Context providers
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Business logic and utilities
│   │   └── validation/          # Input validation and sanitization
│   ├── utils/                    # Pure utility functions
│   ├── config/                   # Configuration files
│   ├── integrations/             # External service integrations
│   ├── test/                     # Test utilities and helpers
│   ├── assets/                   # Static assets (images, fonts)
│   ├── App.tsx                   # Root component
│   ├── main.tsx                  # Application entry point
│   └── index.css                 # Global styles
│
├── supabase/
│   ├── functions/                # Edge Functions (Deno)
│   │   ├── senior-chat/         # AI chat endpoint
│   │   └── _shared/             # Shared utilities
│   └── migrations/               # Database migrations (SQL)
│
├── public/                       # Static assets (served as-is)
├── docs/                         # Documentation
├── scripts/                      # Build and utility scripts
├── .github/                      # GitHub Actions workflows
│
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite build configuration
├── vitest.config.ts              # Test configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── eslint.config.js              # ESLint configuration
└── .env.example                  # Environment variable template
```

### Key Directories

#### `/src/components/`
Reusable React components. Each component should:
- Be in its own file (e.g., `Button.tsx`)
- Have a corresponding test file (e.g., `Button.test.tsx`)
- Export a single default component
- Use TypeScript for props

#### `/src/pages/`
Route-level components. One component per route. These are lazy-loaded in production.

#### `/src/lib/`
Business logic, utilities, and non-UI code. Organized by domain:
- `validation/` - Input validation and sanitization
- `supabase-functions.ts` - Secure API client

#### `/src/hooks/`
Custom React hooks following the `use*` naming convention.

#### `/supabase/functions/`
Deno-based Edge Functions. Each function in its own directory with `index.ts` entry point.

---

## Development Workflow

### Daily Workflow

```bash
# 1. Start your day
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Start development server
npm run dev

# 4. Make changes
# Edit files, test in browser

# 5. Run tests
npm test

# 6. Check linting
npm run lint

# 7. Commit changes
git add .
git commit -m "feat: add your feature"

# 8. Push to remote
git push origin feature/your-feature-name

# 9. Create pull request
# Via GitHub UI
```

### Branch Strategy

```
main (production)
  ↑
develop (staging)
  ↑
feature/* (feature branches)
hotfix/* (urgent fixes)
```

#### Branch Naming

- `feature/user-authentication` - New features
- `fix/login-validation` - Bug fixes
- `refactor/auth-context` - Code refactoring
- `docs/api-documentation` - Documentation
- `test/validation-suite` - Test improvements
- `chore/update-dependencies` - Maintenance

### Commit Messages

Follow Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `style`: Code style changes (formatting)

#### Examples

```bash
# Good commits
feat(auth): add password reset functionality
fix(chat): resolve message duplication issue
refactor(dashboard): extract patient card component
docs(api): update authentication endpoint documentation
test(validation): add XSS prevention test cases

# Bad commits
fixed stuff
updates
WIP
asdf
```

### Pull Request Process

1. **Create PR** from feature branch to `develop`
2. **Fill out PR template** with:
   - Description of changes
   - Testing performed
   - Screenshots (if UI changes)
   - Breaking changes (if any)
3. **Request review** from at least one team member
4. **Address feedback** with additional commits
5. **Squash and merge** once approved

---

## Coding Standards

### TypeScript Guidelines

#### Use Strict Mode

All TypeScript files must use strict mode (configured in `tsconfig.json`):

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

#### Type Annotations

```typescript
// ✅ Good: Explicit return types
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad: Implicit return type
function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ Good: Typed function parameters
const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
};

// ❌ Bad: Untyped parameters
const handleSubmit = (event) => {
  event.preventDefault();
};
```

#### Interface vs Type

- Use `interface` for object shapes that may be extended
- Use `type` for unions, intersections, and utility types

```typescript
// ✅ Good: Interface for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Good: Type for unions
type UserRole = 'senior' | 'caregiver' | 'family_member' | 'admin';

// ✅ Good: Type for utility types
type PartialUser = Partial<User>;
```

#### Avoid `any`

```typescript
// ❌ Bad: Using any
const data: any = fetchData();

// ✅ Good: Proper typing
const data: ApiResponse<User> = await fetchData();

// ✅ Good: Unknown for truly unknown types
const data: unknown = parseJSON(input);
if (isUser(data)) {
  // Type guard ensures safety
  console.log(data.name);
}
```

### React Guidelines

#### Component Structure

```typescript
// ✅ Good: Clean component structure
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
}

export default function UserCard({ user, onEdit }: UserCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">{user.name}</h3>
      {isExpanded && (
        <div className="mt-4">
          <p>{user.email}</p>
          <Button onClick={() => onEdit(user)}>Edit</Button>
        </div>
      )}
    </div>
  );
}
```

#### Hooks Rules

1. **Only call hooks at the top level** (not in loops, conditions, or nested functions)
2. **Only call hooks from React functions**
3. **Custom hooks must start with `use`**

```typescript
// ✅ Good: Hooks at top level
function MyComponent() {
  const [count, setCount] = useState(0);
  const isEven = count % 2 === 0;

  if (isEven) {
    return <div>Count is even: {count}</div>;
  }

  return <div>Count is odd: {count}</div>;
}

// ❌ Bad: Hooks in conditions
function MyComponent() {
  const isEven = count % 2 === 0;

  if (isEven) {
    const [count, setCount] = useState(0); // ❌ Hook in condition
    return <div>{count}</div>;
  }

  return <div>Odd</div>;
}
```

#### Props Destructuring

```typescript
// ✅ Good: Destructure props
function UserCard({ user, onEdit }: UserCardProps) {
  return <div>{user.name}</div>;
}

// ❌ Bad: Use props object
function UserCard(props: UserCardProps) {
  return <div>{props.user.name}</div>;
}
```

#### Key Props

```typescript
// ✅ Good: Unique, stable keys
<ul>
  {users.map((user) => (
    <li key={user.id}>{user.name}</li>
  ))}
</ul>

// ❌ Bad: Index as key (for dynamic lists)
<ul>
  {users.map((user, index) => (
    <li key={index}>{user.name}</li>
  ))}
</ul>
```

### CSS and Styling

#### Tailwind Best Practices

```typescript
// ✅ Good: Use Tailwind utilities
<div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
  <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
  <Button variant="outline">Edit</Button>
</div>

// ✅ Good: Use cn() for conditional classes
import { cn } from '@/lib/utils';

<div className={cn(
  "rounded-lg p-4",
  isActive && "bg-blue-50 border-blue-200",
  isError && "bg-red-50 border-red-200"
)}>
  {content}
</div>

// ❌ Bad: Inline styles
<div style={{ display: 'flex', padding: '16px', borderRadius: '8px' }}>
  {content}
</div>

// ❌ Bad: Custom CSS for utility classes
.my-container {
  display: flex;
  padding: 16px;
  border-radius: 8px;
}
```

#### Component Variants with CVA

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

### File Naming

- **Components**: PascalCase (e.g., `UserCard.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.tsx`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Types**: PascalCase (e.g., `User.ts`, `ApiResponse.ts`)

---

## Testing Guidelines

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/test-utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test (automatic with setup file)
  });

  describe('Rendering', () => {
    it('renders component with correct text', () => {
      renderWithProviders(<MyComponent title="Test Title" />);

      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      renderWithProviders(<MyComponent isLoading />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onClick handler when button clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      renderWithProviders(<MyComponent onClick={handleClick} />);

      const button = screen.getByRole('button', { name: /click me/i });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty data gracefully', () => {
      renderWithProviders(<MyComponent data={[]} />);

      expect(screen.getByText(/no data/i)).toBeInTheDocument();
    });

    it('handles error state', () => {
      renderWithProviders(<MyComponent error="Something went wrong" />);

      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    });
  });
});
```

### Writing Good Tests

#### DO's

✅ **Test user behavior, not implementation**
```typescript
// Good: Test what user sees/does
expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: /submit/i }));

// Bad: Test implementation details
expect(wrapper.state().isSubmitting).toBe(true);
```

✅ **Use semantic queries**
```typescript
// Preferred order:
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
screen.getByPlaceholderText(/enter email/i)
screen.getByText(/welcome/i)
screen.getByDisplayValue(/john/i)
screen.getByAltText(/profile picture/i)
screen.getByTitle(/close/i)
screen.getByTestId('custom-element') // Last resort
```

✅ **Use waitFor for async operations**
```typescript
// Good: Wait for async operation
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});

// Bad: Arbitrary timeout
await new Promise(resolve => setTimeout(resolve, 1000));
```

✅ **Test accessibility**
```typescript
it('is keyboard accessible', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.tab();
  expect(screen.getByLabelText(/email/i)).toHaveFocus();

  await user.tab();
  expect(screen.getByLabelText(/password/i)).toHaveFocus();
});
```

#### DON'Ts

❌ **Don't test third-party libraries**
```typescript
// Bad: Testing React Router
it('navigates to correct route', () => {
  const history = createMemoryHistory();
  // Testing that React Router works...
});

// Good: Test your usage of it
it('redirects to dashboard after login', async () => {
  renderWithProviders(<Login />);
  // Test your component behavior...
});
```

❌ **Don't make tests interdependent**
```typescript
// Bad: Tests depend on order
let userId;
it('creates user', () => {
  userId = createUser();
});
it('updates user', () => {
  updateUser(userId); // Depends on previous test
});

// Good: Each test is independent
it('creates user', () => {
  const userId = createUser();
  expect(userId).toBeDefined();
});
it('updates user', () => {
  const userId = createUser();
  updateUser(userId);
  expect(getUser(userId)).toEqual(updatedUser);
});
```

### Coverage Goals

- **Overall**: 60% minimum
- **Critical paths**: 80% minimum (auth, validation, API)
- **UI components**: 50% minimum
- **Utilities**: 90% minimum

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

---

## Component Development

### Creating a New Component

```bash
# 1. Create component file
touch src/components/MyComponent.tsx

# 2. Create test file
touch src/components/MyComponent.test.tsx

# 3. Implement component
# See template below

# 4. Write tests
# Test rendering, interactions, edge cases

# 5. Export from index (if creating a component library)
# echo "export { default as MyComponent } from './MyComponent';" >> src/components/index.ts
```

### Component Template

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * MyComponent description
 *
 * @example
 * <MyComponent
 *   title="Hello"
 *   onAction={() => console.log('Action!')}
 * />
 */
export interface MyComponentProps {
  /**
   * Component title
   */
  title: string;
  /**
   * Optional subtitle
   */
  subtitle?: string;
  /**
   * Action handler
   */
  onAction: () => void;
  /**
   * Whether component is in loading state
   * @default false
   */
  isLoading?: boolean;
}

export default function MyComponent({
  title,
  subtitle,
  onAction,
  isLoading = false
}: MyComponentProps) {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    onAction();
  };

  if (isLoading) {
    return <div role="status">Loading...</div>;
  }

  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {subtitle && <p className="text-gray-600">{subtitle}</p>}
      <p>Count: {count}</p>
      <Button onClick={handleClick}>
        Click me
      </Button>
    </div>
  );
}
```

### Accessibility Checklist

When creating components:

- [ ] **Semantic HTML**: Use appropriate HTML elements
- [ ] **ARIA labels**: Add `aria-label` for icon buttons
- [ ] **Keyboard navigation**: All interactive elements accessible via keyboard
- [ ] **Focus indicators**: Visible focus states (handled by global CSS)
- [ ] **Color contrast**: Minimum 4.5:1 for text, 3:1 for UI components
- [ ] **Touch targets**: Minimum 44x44px
- [ ] **Screen reader text**: Add `.sr-only` text for icon-only elements
- [ ] **Form labels**: All inputs have associated `<label>`
- [ ] **Error messages**: Associate with fields using `aria-describedby`

```typescript
// Example: Accessible icon button
<button
  aria-label="Delete user"
  className="rounded p-2 hover:bg-gray-100"
>
  <Trash2 aria-hidden="true" className="h-5 w-5" />
</button>

// Example: Form with proper labels
<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    aria-required="true"
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? "email-error" : undefined}
  />
  {errors.email && (
    <p id="email-error" className="text-sm text-red-600">
      {errors.email.message}
    </p>
  )}
</div>
```

---

## State Management

### Local State (useState)

For component-specific state:

```typescript
const [isOpen, setIsOpen] = useState(false);
const [formData, setFormData] = useState({ name: '', email: '' });
```

### Derived State

Compute from existing state instead of storing separately:

```typescript
// ✅ Good: Derived state
const [users, setUsers] = useState<User[]>([]);
const activeUsers = users.filter(user => user.isActive);
const userCount = users.length;

// ❌ Bad: Redundant state
const [users, setUsers] = useState<User[]>([]);
const [activeUsers, setActiveUsers] = useState<User[]>([]);
const [userCount, setUserCount] = useState(0);
```

### Global State (Context)

For app-wide state like authentication:

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Implementation...

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Server State (React Query)

For API data:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch data
function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'senior');

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutate data
function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patient: Patient) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(patient)
        .eq('id', patient.id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

// Usage in component
function PatientList() {
  const { data: patients, isLoading, error } = usePatients();
  const updatePatient = useUpdatePatient();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {patients.map(patient => (
        <li key={patient.id}>{patient.name}</li>
      ))}
    </ul>
  );
}
```

---

## API Integration

### Supabase Client

Always use the configured client:

```typescript
import { supabase } from '@/integrations/supabase/client';

// ✅ Good
const { data, error } = await supabase.from('profiles').select('*');

// ❌ Bad: Creating new client
const newClient = createClient(url, key);
```

### Error Handling

```typescript
// ✅ Good: Proper error handling
try {
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('Database error:', error);
    toast.error('Failed to load profiles');
    return;
  }

  // Use data...
} catch (err) {
  console.error('Unexpected error:', err);
  toast.error('Something went wrong');
}

// ✅ Good: React Query error handling
const { data, error } = useQuery({
  queryKey: ['profiles'],
  queryFn: fetchProfiles,
  retry: 3,
  onError: (error) => {
    console.error('Query failed:', error);
    toast.error('Failed to load data');
  },
});
```

### Calling Edge Functions

Use the secure wrapper:

```typescript
import { callSupabaseFunctionStreaming } from '@/lib/supabase-functions';

// ✅ Good: Secure function call
const response = await callSupabaseFunctionStreaming({
  functionName: 'senior-chat',
  body: { messages: [...] },
});

// ❌ Bad: Direct fetch (exposes Bearer token)
const response = await fetch(url, {
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
  }
});
```

---

## Database Development

### Creating Migrations

```bash
# 1. Create new migration file
# Format: YYYYMMDDHHMMSS_description.sql
touch supabase/migrations/20251012120000_add_user_preferences.sql

# 2. Write SQL
# See template below

# 3. Apply migration (local)
supabase db reset

# 4. Apply migration (remote)
supabase db push
```

### Migration Template

```sql
-- Migration: Add user preferences
-- Description: Add preferences column to profiles table
-- Date: 2025-10-12

-- Add column
ALTER TABLE public.profiles
ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;

-- Add index for JSONB queries
CREATE INDEX idx_profiles_preferences
ON public.profiles USING GIN (preferences);

-- Update existing rows
UPDATE public.profiles
SET preferences = '{"theme": "light", "notifications": true}'::jsonb
WHERE preferences IS NULL;

-- Add comment
COMMENT ON COLUMN public.profiles.preferences IS 'User preferences in JSONB format';
```

### RLS Policy Development

```sql
-- Example: Allow users to view their own profile
CREATE POLICY "users_view_own_profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Example: Caregivers can view patient profiles
CREATE POLICY "caregivers_view_patients"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.care_relationships
    WHERE patient_id = profiles.id
    AND caregiver_id = auth.uid()
    AND status = 'active'
  )
);
```

---

## Security Best Practices

### Input Validation

Always validate user input:

```typescript
import { loginSchema } from '@/lib/validation/schemas';

// ✅ Good: Validate with Zod
const result = loginSchema.safeParse(formData);
if (!result.success) {
  console.error('Validation failed:', result.error);
  return;
}

// Use validated data
const { email, password } = result.data;
```

### Input Sanitization

Sanitize before storing or displaying:

```typescript
import { sanitizeChatMessage } from '@/lib/validation/sanitization';

// ✅ Good: Sanitize user input
const cleanMessage = sanitizeChatMessage(userInput);

// ❌ Bad: Direct use of user input
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### Never Log Sensitive Data

```typescript
// ❌ Bad
console.log('User password:', password);
console.log('Auth token:', token);

// ✅ Good
console.log('User logged in:', user.id);
console.log('Auth successful');
```

---

## Performance Optimization

### Code Splitting

```typescript
// ✅ Good: Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));

<Suspense fallback={<Loading />}>
  <Dashboard />
</Suspense>
```

### Memoization

```typescript
// ✅ Good: Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ Good: Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);

// ✅ Good: Memoize components
const MemoizedComponent = memo(MyComponent);
```

---

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

All components must meet WCAG 2.1 Level AA standards:

- **1.4.3 Contrast**: Minimum 4.5:1 for text, 3:1 for UI components
- **2.1.1 Keyboard**: All functionality available via keyboard
- **2.4.7 Focus Visible**: Visible focus indicators
- **4.1.2 Name, Role, Value**: All elements have accessible names

### Testing Accessibility

```bash
# Run axe DevTools in browser
# 1. Open browser DevTools
# 2. Click Axe DevTools tab
# 3. Click "Scan All of My Page"
# 4. Fix any violations

# Test keyboard navigation
# 1. Use Tab to navigate forward
# 2. Use Shift+Tab to navigate backward
# 3. Use Enter/Space to activate
# 4. Use Escape to close modals

# Test with screen reader (NVDA on Windows)
# 1. Download NVDA
# 2. Navigate your app
# 3. Ensure all content is announced
```

---

## Debugging

### Browser DevTools

```typescript
// Add breakpoints
debugger;

// Console logging (remove before commit)
console.log('Debug:', { user, profile });
console.table(users); // Nice table format
console.group('User Actions');
console.log('Action 1');
console.log('Action 2');
console.groupEnd();
```

### React DevTools

1. Install React DevTools browser extension
2. Open DevTools → Components tab
3. Inspect component props and state
4. Use Profiler to find performance issues

### Supabase Logs

```bash
# View logs in Supabase Dashboard
# 1. Go to Supabase Dashboard
# 2. Click "Logs"
# 3. View Edge Function logs, Database logs, Auth logs
```

---

## Contribution Guidelines

### Before Submitting PR

- [ ] All tests passing (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Accessibility tested (keyboard, screen reader)
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow conventions

### Code Review Checklist

Reviewers should check:

- [ ] Code follows style guidelines
- [ ] Tests cover new functionality
- [ ] No console.log statements left
- [ ] No commented-out code
- [ ] Accessibility maintained
- [ ] Security best practices followed
- [ ] Performance not degraded

---

## Additional Resources

### Documentation
- [PROJECT_OVERVIEW.md](/workspace/para-kind-connect-local/PROJECT_OVERVIEW.md) - Project overview
- [API_DOCUMENTATION.md](/workspace/para-kind-connect-local/API_DOCUMENTATION.md) - API reference
- [ARCHITECTURE.md](/workspace/para-kind-connect-local/ARCHITECTURE.md) - Architecture deep dive

### External Resources
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest/docs)
- [Vitest](https://vitest.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Document Version**: 1.0.0
**Last Updated**: October 12, 2025
**Maintained By**: Para Connect Development Team
