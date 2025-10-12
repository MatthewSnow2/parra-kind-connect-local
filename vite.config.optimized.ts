import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// Manual implementation of visualizer since we can't install packages
function customBundleAnalyzer() {
  return {
    name: 'custom-bundle-analyzer',
    generateBundle(options: any, bundle: any) {
      const sizes: Record<string, number> = {};
      let totalSize = 0;

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if ((chunk as any).type === 'chunk' || fileName.endsWith('.js')) {
          const size = (chunk as any).code ? (chunk as any).code.length : 0;
          sizes[fileName] = size;
          totalSize += size;
        }
      }

      console.log('\n📦 Bundle Size Analysis:');
      console.log('========================');

      const sortedSizes = Object.entries(sizes).sort((a, b) => b[1] - a[1]);

      sortedSizes.forEach(([name, size]) => {
        const sizeInKB = (size / 1024).toFixed(2);
        const percentage = ((size / totalSize) * 100).toFixed(1);
        console.log(`${name}: ${sizeInKB} KB (${percentage}%)`);
      });

      console.log('------------------------');
      console.log(`Total Bundle Size: ${(totalSize / 1024).toFixed(2)} KB`);
      console.log('========================\n');
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },

  plugins: [
    react(),

    // Only include lovable-tagger in development
    mode === 'development' && componentTagger(),

    // Split vendor chunks for better caching
    splitVendorChunkPlugin(),

    // Custom bundle analyzer
    mode === 'production' && customBundleAnalyzer(),
  ].filter(Boolean),

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // Enable minification with terser for better compression
    minify: 'terser',

    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true, // Remove debugger statements
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
      },
      mangle: {
        // Mangle property names for smaller output
        properties: {
          regex: /^_/, // Only mangle properties starting with _
        },
      },
      format: {
        comments: false, // Remove all comments
      },
    },

    // Set chunk size warnings
    chunkSizeWarningLimit: 500, // Warn for chunks over 500kb

    // Rollup options for better code splitting
    rollupOptions: {
      output: {
        // Manual chunking strategy
        manualChunks: (id) => {
          // Separate node_modules into vendor chunks
          if (id.includes('node_modules')) {
            // React and related libraries
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }

            // Radix UI components
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }

            // Supabase client
            if (id.includes('@supabase')) {
              return 'supabase';
            }

            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'forms';
            }

            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-utils';
            }

            // Chart libraries
            if (id.includes('recharts')) {
              return 'charts';
            }

            // UI utilities
            if (id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge')) {
              return 'ui-utils';
            }

            // Everything else from node_modules
            return 'vendor';
          }

          // Split application code by feature
          if (id.includes('src/pages/')) {
            const parts = id.split('/');
            const pageIndex = parts.indexOf('pages');
            if (pageIndex !== -1 && parts[pageIndex + 1]) {
              const pageName = parts[pageIndex + 1].replace('.tsx', '').toLowerCase();
              return `page-${pageName}`;
            }
          }

          // UI components in separate chunk
          if (id.includes('src/components/ui/')) {
            return 'ui-components';
          }

          // Other components
          if (id.includes('src/components/')) {
            return 'components';
          }
        },

        // Configure chunk file naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/js/${chunkInfo.name}-[hash].js`;
        },

        // Configure entry file naming
        entryFileNames: 'assets/js/[name]-[hash].js',

        // Configure asset file naming
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name?.split('.').pop();
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || '')) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/woff2?|ttf|eot|otf/i.test(extType || '')) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[ext]/[name]-[hash][extname]';
        },
      },

      // Tree shaking configuration
      treeshake: {
        preset: 'recommended',
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false,
      },
    },

    // Enable source maps for production debugging
    sourcemap: mode === 'production' ? 'hidden' : true,

    // Increase the limit for inlining assets
    assetsInlineLimit: 4096, // 4kb

    // Enable CSS code splitting
    cssCodeSplit: true,

    // Target modern browsers for smaller bundles
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],

    // Report compressed size
    reportCompressedSize: false, // Disable to speed up builds
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
    ],
    exclude: [
      'lovable-tagger', // Exclude from production
    ],
  },

  // Production-specific optimizations
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    legalComments: 'none',
    target: 'es2020',
  },

  // Add performance hints
  define: {
    // Define constants for dead code elimination
    'process.env.NODE_ENV': JSON.stringify(mode),
    __DEV__: mode === 'development',
    __PROD__: mode === 'production',
  },
}));