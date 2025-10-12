/**
 * Performance Monitoring Utilities
 *
 * This module provides utilities for monitoring and tracking application performance,
 * including Core Web Vitals, custom metrics, and performance analytics.
 */

// Core Web Vitals thresholds (in milliseconds)
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 },   // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
};

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface CustomMetric {
  name: string;
  value: number;
  metadata?: Record<string, any>;
}

/**
 * Report performance metrics to analytics service
 */
const reportMetric = (metric: PerformanceMetric) => {
  // In production, send to analytics service (e.g., Google Analytics, DataDog)
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        event_label: metric.rating,
        non_interaction: true,
      });
    }

    // Example: Send to custom analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    }).catch(err => console.error('Failed to report metric:', err));
  }

  // Always log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Performance Metric:', metric);
  }
};

/**
 * Calculate rating based on value and thresholds
 */
const getRating = (
  value: number,
  thresholds: { good: number; needsImprovement: number }
): 'good' | 'needs-improvement' | 'poor' => {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
};

/**
 * Monitor Largest Contentful Paint (LCP)
 * Measures loading performance
 */
export const monitorLCP = () => {
  if (typeof window === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;

      const metric: PerformanceMetric = {
        name: 'LCP',
        value: lastEntry.renderTime || lastEntry.loadTime,
        rating: getRating(
          lastEntry.renderTime || lastEntry.loadTime,
          THRESHOLDS.LCP
        ),
        timestamp: Date.now(),
      };

      reportMetric(metric);
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (error) {
    console.error('Error monitoring LCP:', error);
  }
};

/**
 * Monitor First Input Delay (FID)
 * Measures interactivity
 */
export const monitorFID = () => {
  if (typeof window === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const metric: PerformanceMetric = {
          name: 'FID',
          value: entry.processingStart - entry.startTime,
          rating: getRating(
            entry.processingStart - entry.startTime,
            THRESHOLDS.FID
          ),
          timestamp: Date.now(),
        };

        reportMetric(metric);
      });
    });

    observer.observe({ type: 'first-input', buffered: true });
  } catch (error) {
    console.error('Error monitoring FID:', error);
  }
};

/**
 * Monitor Cumulative Layout Shift (CLS)
 * Measures visual stability
 */
export const monitorCLS = () => {
  if (typeof window === 'undefined') return;

  let clsValue = 0;
  let clsEntries: any[] = [];

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          clsEntries.push(entry);
        }
      });

      const metric: PerformanceMetric = {
        name: 'CLS',
        value: clsValue,
        rating: getRating(clsValue, THRESHOLDS.CLS),
        timestamp: Date.now(),
      };

      reportMetric(metric);
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (error) {
    console.error('Error monitoring CLS:', error);
  }
};

/**
 * Monitor First Contentful Paint (FCP)
 * Measures perceived loading speed
 */
export const monitorFCP = () => {
  if (typeof window === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const metric: PerformanceMetric = {
          name: 'FCP',
          value: entry.startTime,
          rating: getRating(entry.startTime, THRESHOLDS.FCP),
          timestamp: Date.now(),
        };

        reportMetric(metric);
      });
    });

    observer.observe({ type: 'paint', buffered: true });
  } catch (error) {
    console.error('Error monitoring FCP:', error);
  }
};

/**
 * Monitor Time to First Byte (TTFB)
 * Measures server response time
 */
export const monitorTTFB = () => {
  if (typeof window === 'undefined') return;

  try {
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;

      const metric: PerformanceMetric = {
        name: 'TTFB',
        value: ttfb,
        rating: getRating(ttfb, THRESHOLDS.TTFB),
        timestamp: Date.now(),
      };

      reportMetric(metric);
    }
  } catch (error) {
    console.error('Error monitoring TTFB:', error);
  }
};

/**
 * Monitor bundle size and resource loading
 */
export const monitorResourceLoading = () => {
  if (typeof window === 'undefined') return;

  try {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource');

      let totalSize = 0;
      const resourcesByType: Record<string, { count: number; size: number }> = {};

      resources.forEach((resource: any) => {
        const type = resource.initiatorType || 'other';
        const size = resource.transferSize || 0;

        totalSize += size;

        if (!resourcesByType[type]) {
          resourcesByType[type] = { count: 0, size: 0 };
        }

        resourcesByType[type].count++;
        resourcesByType[type].size += size;
      });

      console.log('📦 Resource Loading Summary:');
      console.log(`Total resources: ${resources.length}`);
      console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log('\nBy type:');
      Object.entries(resourcesByType).forEach(([type, stats]) => {
        console.log(`  ${type}: ${stats.count} files, ${(stats.size / 1024).toFixed(2)} KB`);
      });
    });
  } catch (error) {
    console.error('Error monitoring resource loading:', error);
  }
};

/**
 * Track custom performance metrics
 */
export const trackCustomMetric = (name: string, value: number, metadata?: Record<string, any>) => {
  const metric: CustomMetric = {
    name,
    value,
    metadata: {
      ...metadata,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
    },
  };

  if (process.env.NODE_ENV === 'production') {
    // Send to analytics service
    fetch('/api/analytics/custom-metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    }).catch(err => console.error('Failed to track custom metric:', err));
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 Custom Metric:', metric);
  }
};

/**
 * Measure component render time
 */
export const measureComponentRender = (componentName: string, callback: () => void) => {
  const start = performance.now();
  callback();
  const end = performance.now();
  const duration = end - start;

  trackCustomMetric('component-render', duration, { componentName });

  if (duration > 16) {
    // Warn if render takes longer than one frame (16ms at 60fps)
    console.warn(`⚠️ Slow render: ${componentName} took ${duration.toFixed(2)}ms`);
  }
};

/**
 * Monitor memory usage (if available)
 */
export const monitorMemory = () => {
  if (typeof window === 'undefined') return;

  const performance = (window.performance as any);
  if (performance.memory) {
    const memoryInfo = {
      usedJSHeapSize: (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
      totalJSHeapSize: (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
      jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2),
    };

    console.log('💾 Memory Usage:', memoryInfo);

    trackCustomMetric('memory-usage', performance.memory.usedJSHeapSize, memoryInfo);
  }
};

/**
 * Initialize all performance monitoring
 */
export const initPerformanceMonitoring = () => {
  if (typeof window === 'undefined') return;

  console.log('🚀 Initializing performance monitoring...');

  // Monitor Core Web Vitals
  monitorLCP();
  monitorFID();
  monitorCLS();
  monitorFCP();
  monitorTTFB();

  // Monitor resource loading
  monitorResourceLoading();

  // Monitor memory (in development only)
  if (process.env.NODE_ENV === 'development') {
    setInterval(monitorMemory, 30000); // Check every 30 seconds
  }

  console.log('✅ Performance monitoring initialized');
};

/**
 * Create a performance mark
 */
export const mark = (name: string) => {
  if (typeof window !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
};

/**
 * Measure time between two marks
 */
export const measure = (name: string, startMark: string, endMark: string) => {
  if (typeof window !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      trackCustomMetric(name, measure.duration);
      return measure.duration;
    } catch (error) {
      console.error(`Error measuring ${name}:`, error);
    }
  }
  return 0;
};

/**
 * Clear performance marks and measures
 */
export const clearMarks = () => {
  if (typeof window !== 'undefined' && performance.clearMarks) {
    performance.clearMarks();
    performance.clearMeasures();
  }
};

export default {
  initPerformanceMonitoring,
  monitorLCP,
  monitorFID,
  monitorCLS,
  monitorFCP,
  monitorTTFB,
  monitorResourceLoading,
  trackCustomMetric,
  measureComponentRender,
  monitorMemory,
  mark,
  measure,
  clearMarks,
};