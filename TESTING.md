# Testing Documentation - Para Connect

## Overview

This document provides comprehensive information about the testing infrastructure for the Para Connect application. Our testing strategy ensures high-quality, reliable code through automated testing at multiple levels.

## Table of Contents

1. [Testing Stack](#testing-stack)
2. [Running Tests](#running-tests)
3. [Writing Tests](#writing-tests)
4. [Test Coverage](#test-coverage)
5. [Best Practices](#best-practices)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

## Testing Stack

### Core Tools

- **Vitest**: Fast unit test framework with native ESM support
- **React Testing Library**: Testing utilities for React components
- **jsdom**: DOM implementation for Node.js
- **@testing-library/user-event**: Simulates user interactions
- **@testing-library/jest-dom**: Custom matchers for DOM assertions

### Coverage Tools

- **@vitest/coverage-v8**: Fast coverage reporting using V8
- **@vitest/ui**: Interactive UI for test exploration

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Open Vitest UI
npm run test:ui
```

### Filtering Tests

```bash
# Run specific test file
npm test src/components/Login.test.tsx

# Run tests matching pattern
npm test -- Login

# Run only tests with specific name
npm test -- -t "validates email"
```

### Watch Mode Tips

- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `p` to filter by filename
- Press `t` to filter by test name
- Press `q` to quit

## Writing Tests

### File Structure

Tests should be co-located with the code they test:

```
src/
  components/
    Button.tsx
    Button.test.tsx        # Component tests
  lib/
    utils.ts
    utils.test.ts          # Utility function tests
  pages/
    Login.tsx
    Login.test.tsx         # Page component tests
```

### Test File Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils/test-utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders component correctly', () => {
      renderWithProviders(<MyComponent />);

      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles button click', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      renderWithProviders(<MyComponent onClick={handleClick} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Test Utilities

#### Custom Render Functions

```typescript
import { renderWithProviders } from '@/test/utils/test-utils';

// Renders with all providers (Router, Query, Auth, Tooltip)
renderWithProviders(<MyComponent />);

// Render with Router only
renderWithRouter(<MyComponent />);

// Render with Query Client only
renderWithQuery(<MyComponent />);
```

#### Mock Data

```typescript
import {
  createMockUser,
  createMockProfile,
  mockSeniorProfile,
  mockCaregiverProfile
} from '@/test/utils/mock-data';

// Create custom mock user
const user = createMockUser({ email: 'custom@example.com' });

// Use predefined mocks
const profile = mockSeniorProfile;
```

#### Supabase Mocks

```typescript
import {
  mockSupabaseClient,
  mockSuccessfulAuth,
  mockFailedAuth,
  resetSupabaseMocks
} from '@/test/utils/supabase-mocks';

beforeEach(() => {
  resetSupabaseMocks();
});

it('handles successful login', async () => {
  mockSuccessfulAuth();
  // ... test code
});
```

### Testing Patterns

#### Testing Form Validation

```typescript
it('displays validation error for invalid email', async () => {
  const user = userEvent.setup();
  renderWithProviders(<LoginForm />);

  const emailInput = screen.getByLabelText(/email/i);
  await user.type(emailInput, 'invalid-email');

  const submitButton = screen.getByRole('button', { name: /submit/i });
  await user.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
  });
});
```

#### Testing Async Operations

```typescript
it('displays loading state during async operation', async () => {
  const user = userEvent.setup();
  const slowOperation = vi.fn()
    .mockImplementation(() => new Promise(resolve =>
      setTimeout(resolve, 100)
    ));

  renderWithProviders(<MyComponent onSubmit={slowOperation} />);

  const button = screen.getByRole('button');
  await user.click(button);

  // Check loading state appears
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Wait for operation to complete
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
});
```

#### Testing Protected Routes

```typescript
it('redirects to login when not authenticated', async () => {
  mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    // ... other auth values
  });

  renderWithProviders(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/protected"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );

  await waitFor(() => {
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
```

#### Testing User Events

```typescript
it('handles user typing and submission', async () => {
  const user = userEvent.setup();
  const handleSubmit = vi.fn();

  renderWithProviders(<SearchForm onSubmit={handleSubmit} />);

  const input = screen.getByRole('textbox');
  await user.type(input, 'search query');
  await user.keyboard('{Enter}');

  expect(handleSubmit).toHaveBeenCalledWith('search query');
});
```

## Test Coverage

### Coverage Goals

- **Overall Coverage**: 60% minimum
- **Critical Paths**: 80% minimum (auth, validation, API calls)
- **UI Components**: 50% minimum
- **Utility Functions**: 90% minimum

### Viewing Coverage

```bash
# Generate and view coverage report
npm run test:coverage

# Open HTML coverage report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

### Coverage Configuration

Coverage is configured in `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  exclude: [
    'node_modules/',
    'src/test/',
    '**/*.d.ts',
    '**/*.config.*',
    'src/components/ui/**', // Exclude third-party UI components
  ],
  lines: 60,
  functions: 60,
  branches: 60,
  statements: 60,
}
```

## Best Practices

### DO's

1. **Test user behavior, not implementation**
   ```typescript
   // Good
   expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();

   // Avoid
   expect(wrapper.find('.submit-button')).toHaveLength(1);
   ```

2. **Use semantic queries**
   ```typescript
   // Preferred order
   screen.getByRole('button', { name: /submit/i })
   screen.getByLabelText(/email/i)
   screen.getByText(/welcome/i)
   screen.getByTestId('custom-element') // Last resort
   ```

3. **Test accessibility**
   ```typescript
   it('is keyboard accessible', async () => {
     const user = userEvent.setup();
     render(<Button>Click me</Button>);

     await user.tab();
     expect(screen.getByRole('button')).toHaveFocus();
   });
   ```

4. **Mock external dependencies**
   ```typescript
   // Mock Supabase calls
   vi.mock('@/integrations/supabase/client', () => ({
     supabase: mockSupabaseClient,
   }));
   ```

5. **Clean up after tests**
   ```typescript
   beforeEach(() => {
     vi.clearAllMocks();
   });

   afterEach(() => {
     cleanup(); // Automatic with setup file
   });
   ```

### DON'Ts

1. **Don't test implementation details**
   - Avoid testing state directly
   - Focus on user-facing behavior

2. **Don't use arbitrary waits**
   ```typescript
   // Bad
   await new Promise(resolve => setTimeout(resolve, 1000));

   // Good
   await waitFor(() => {
     expect(screen.getByText(/success/i)).toBeInTheDocument();
   });
   ```

3. **Don't test third-party libraries**
   - Trust that React Router works
   - Test your usage of it

4. **Don't make tests interdependent**
   - Each test should be isolated
   - Tests should pass in any order

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

### Workflow Features

- Tests on Node.js 18.x and 20.x
- Linting before tests
- Coverage reports uploaded to Codecov
- Coverage comments on pull requests
- Build verification after tests pass

### Local CI Simulation

```bash
# Run the same checks as CI
npm run lint && npm test && npm run build
```

## Troubleshooting

### Common Issues

#### Tests fail locally but pass in CI

**Solution**: Ensure you're using the same Node version as CI:
```bash
nvm use 20  # or specified version
npm ci
npm test
```

#### "Cannot find module" errors

**Solution**: Check path aliases in `vitest.config.ts`:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

#### jsdom environment errors

**Solution**: Ensure `environment: 'jsdom'` is set in config:
```typescript
test: {
  environment: 'jsdom',
}
```

#### Flaky tests

**Solutions**:
1. Use `waitFor` for async operations
2. Avoid hardcoded timeouts
3. Mock timers if testing time-dependent code:
   ```typescript
   vi.useFakeTimers();
   vi.runAllTimers();
   vi.useRealTimers();
   ```

#### Coverage not updating

**Solution**: Clear coverage cache:
```bash
rm -rf coverage/
npm run test:coverage
```

### Getting Help

1. Check [Vitest Documentation](https://vitest.dev/)
2. Check [React Testing Library Documentation](https://testing-library.com/react)
3. Review existing tests in the codebase
4. Ask in team Slack channel

## Future Improvements

- [ ] E2E tests with Playwright
- [ ] Visual regression testing
- [ ] Performance benchmarking
- [ ] Component integration tests
- [ ] API contract testing
- [ ] Accessibility automated testing (axe-core)
- [ ] Mutation testing (Stryker)

## Additional Resources

- [Vitest API Reference](https://vitest.dev/api/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Testing Library User Events](https://testing-library.com/docs/user-event/intro)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Last Updated**: 2025-10-12
**Maintained By**: Development Team
