/**
 * Vitest Global Setup
 *
 * This file runs before all test files and sets up the testing environment
 * including React Testing Library, jsdom extensions, and custom matchers.
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
  cleanup();
});

// Setup global mocks
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as any;

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as any;

  // Mock scrollTo
  window.scrollTo = vi.fn();

  // Mock HTMLElement.prototype methods that might not be available in jsdom
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn();
  HTMLElement.prototype.releasePointerCapture = vi.fn();
  HTMLElement.prototype.setPointerCapture = vi.fn();

  // Mock console methods to reduce noise in tests (optional)
  // Uncomment if you want to silence console output during tests
  // global.console = {
  //   ...console,
  //   log: vi.fn(),
  //   debug: vi.fn(),
  //   info: vi.fn(),
  //   warn: vi.fn(),
  //   error: vi.fn(),
  // };
});

// Add custom matchers if needed
// expect.extend({
//   yourCustomMatcher(received, expected) {
//     // implementation
//   },
// });
