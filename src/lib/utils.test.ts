/**
 * Unit Tests for Utility Functions
 *
 * Tests for the cn() utility function used for conditional classNames
 */

import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('px-2 py-1', 'bg-red-500');
    expect(result).toContain('px-2');
    expect(result).toContain('py-1');
    expect(result).toContain('bg-red-500');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
  });

  it('filters out false conditions', () => {
    const isActive = false;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toContain('base-class');
    expect(result).not.toContain('active-class');
  });

  it('handles undefined and null values', () => {
    const result = cn('base-class', undefined, null);
    expect(result).toContain('base-class');
  });

  it('merges Tailwind classes correctly (twMerge functionality)', () => {
    // Later class should override earlier class
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toContain('px-4');
    expect(result).not.toContain('px-2');
  });

  it('handles empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('handles array of classes', () => {
    const result = cn(['px-2', 'py-1'], 'bg-red-500');
    expect(result).toContain('px-2');
    expect(result).toContain('py-1');
    expect(result).toContain('bg-red-500');
  });

  it('handles object notation', () => {
    const result = cn({
      'px-2': true,
      'py-1': true,
      'bg-red-500': false,
    });
    expect(result).toContain('px-2');
    expect(result).toContain('py-1');
    expect(result).not.toContain('bg-red-500');
  });

  it('combines multiple types of inputs', () => {
    const isActive = true;
    const result = cn(
      'base-class',
      ['px-2', 'py-1'],
      {
        'hover:bg-blue-500': true,
        'disabled': false,
      },
      isActive && 'active'
    );
    expect(result).toContain('base-class');
    expect(result).toContain('px-2');
    expect(result).toContain('py-1');
    expect(result).toContain('hover:bg-blue-500');
    expect(result).toContain('active');
    expect(result).not.toContain('disabled');
  });

  it('handles conflicting Tailwind utilities', () => {
    // Test that twMerge properly handles conflicting utilities
    const result = cn('text-sm text-lg', 'text-xl');
    expect(result).toContain('text-xl');
    expect(result).not.toContain('text-sm');
    expect(result).not.toContain('text-lg');
  });

  it('preserves non-conflicting classes', () => {
    const result = cn('text-sm font-bold', 'text-lg text-blue-500');
    expect(result).toContain('font-bold');
    expect(result).toContain('text-blue-500');
    expect(result).toContain('text-lg');
    expect(result).not.toContain('text-sm');
  });
});
