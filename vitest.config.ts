/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Use happy-dom environment for DOM testing (faster alternative to jsdom)
    environment: 'happy-dom',

    // Setup files to run before each test file
    setupFiles: ['./src/test/setup.ts'],

    // Global test utilities
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        // Exclude generated types
        'src/integrations/supabase/types.ts',
        // Exclude UI components (these are from shadcn/ui library)
        'src/components/ui/**',
      ],
      include: ['src/**/*.{ts,tsx}'],
      all: true,
      lines: 60,
      functions: 60,
      branches: 60,
      statements: 60,
    },

    // Test include/exclude patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // Test execution
    testTimeout: 10000,
    hookTimeout: 10000,

    // Mocking
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,

    // Reporter configuration
    reporters: ['verbose'],

    // Threads configuration for parallel test execution
    threads: true,
    maxThreads: 4,
    minThreads: 1,

    // Watch mode configuration
    watch: false,

    // UI configuration
    ui: false,

    // File parallelization
    fileParallelism: true,
  },
});
