/**
 * Rate Limiting Utilities
 *
 * Client-side rate limiting to prevent abuse and reduce server load.
 * Works in conjunction with server-side rate limiting.
 *
 * Security Features:
 * - Prevents rapid-fire submissions
 * - Token bucket algorithm
 * - Per-action rate limits
 * - User feedback for rate limit status
 * - Automatic cleanup of old entries
 *
 * NOTE: This is CLIENT-SIDE rate limiting only. Always implement
 * server-side rate limiting as the authoritative control.
 *
 * @module validation/rate-limiting
 */

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked?: boolean;
  blockedUntil?: number;
}

/**
 * Rate limiter class
 */
export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private readonly cleanupIntervalMs: number = 60000) {
    this.startCleanup();
  }

  /**
   * Check if an action is rate limited
   *
   * @param key - Unique key for the action (e.g., 'login:user@example.com')
   * @param config - Rate limit configuration
   * @returns Whether the action is allowed and time until next attempt
   */
  check(
    key: string,
    config: RateLimitConfig
  ): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    // Check if blocked
    if (entry?.blocked && entry.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: entry.blockedUntil - now,
      };
    }

    // No previous entry or window expired
    if (!entry || now - entry.firstAttempt > config.windowMs) {
      this.store.set(key, {
        attempts: 0,
        firstAttempt: now,
        lastAttempt: now,
      });
      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetIn: config.windowMs,
      };
    }

    // Within window
    const remaining = config.maxAttempts - entry.attempts;
    const resetIn = config.windowMs - (now - entry.firstAttempt);

    if (entry.attempts >= config.maxAttempts) {
      // Block if configured
      if (config.blockDurationMs) {
        this.store.set(key, {
          ...entry,
          blocked: true,
          blockedUntil: now + config.blockDurationMs,
        });
      }

      return {
        allowed: false,
        remaining: 0,
        resetIn: config.blockDurationMs || resetIn,
      };
    }

    return {
      allowed: true,
      remaining: remaining - 1,
      resetIn,
    };
  }

  /**
   * Record an attempt
   *
   * @param key - Unique key for the action
   */
  record(key: string): void {
    const now = Date.now();
    const entry = this.store.get(key);

    if (entry) {
      this.store.set(key, {
        ...entry,
        attempts: entry.attempts + 1,
        lastAttempt: now,
      });
    } else {
      this.store.set(key, {
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
    }
  }

  /**
   * Reset rate limit for a key
   *
   * @param key - Unique key for the action
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Start automatic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const maxAge = 3600000; // 1 hour

      for (const [key, entry] of this.store.entries()) {
        if (now - entry.lastAttempt > maxAge) {
          this.store.delete(key);
        }
      }
    }, this.cleanupIntervalMs);
  }

  /**
   * Stop automatic cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

/**
 * Global rate limiter instance
 */
export const globalRateLimiter = new RateLimiter();

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // Authentication
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
  },
  SIGNUP: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000, // 1 hour
  },
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
  },

  // Chat
  CHAT_MESSAGE: {
    maxAttempts: 30,
    windowMs: 60 * 1000, // 1 minute
  },
  CHAT_SESSION: {
    maxAttempts: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },

  // Notes and data
  NOTE_CREATE: {
    maxAttempts: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  PROFILE_UPDATE: {
    maxAttempts: 5,
    windowMs: 60 * 1000, // 1 minute
  },

  // API calls
  API_CALL: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Check rate limit for an action
 *
 * @param action - Action identifier
 * @param userId - User ID or identifier
 * @param config - Rate limit configuration
 * @returns Rate limit check result
 */
export function checkRateLimit(
  action: string,
  userId: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const key = `${action}:${userId}`;
  return globalRateLimiter.check(key, config);
}

/**
 * Record a rate limited action
 *
 * @param action - Action identifier
 * @param userId - User ID or identifier
 */
export function recordRateLimitedAction(action: string, userId: string): void {
  const key = `${action}:${userId}`;
  globalRateLimiter.record(key);
}

/**
 * Reset rate limit for an action
 *
 * @param action - Action identifier
 * @param userId - User ID or identifier
 */
export function resetRateLimit(action: string, userId: string): void {
  const key = `${action}:${userId}`;
  globalRateLimiter.reset(key);
}

/**
 * Format time remaining for display
 *
 * @param ms - Milliseconds
 * @returns Formatted string
 */
export function formatTimeRemaining(ms: number): string {
  if (ms < 1000) {
    return 'a moment';
  }

  const seconds = Math.ceil(ms / 1000);

  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  const minutes = Math.ceil(seconds / 60);

  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
}

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly resetIn: number,
    public readonly remaining: number = 0
  ) {
    super(message);
    this.name = 'RateLimitError';
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    const timeStr = formatTimeRemaining(this.resetIn);
    return `Too many attempts. Please try again in ${timeStr}.`;
  }
}

/**
 * React hook for rate limiting
 */
export function useRateLimit(
  action: string,
  config: RateLimitConfig
): {
  isAllowed: (userId: string) => boolean;
  record: (userId: string) => void;
  check: (userId: string) => { allowed: boolean; remaining: number; resetIn: number };
  getTimeRemaining: (userId: string) => string;
} {
  const isAllowed = (userId: string): boolean => {
    const result = checkRateLimit(action, userId, config);
    return result.allowed;
  };

  const record = (userId: string): void => {
    recordRateLimitedAction(action, userId);
  };

  const check = (userId: string) => {
    return checkRateLimit(action, userId, config);
  };

  const getTimeRemaining = (userId: string): string => {
    const result = checkRateLimit(action, userId, config);
    return formatTimeRemaining(result.resetIn);
  };

  return {
    isAllowed,
    record,
    check,
    getTimeRemaining,
  };
}

/**
 * Throttle function execution
 *
 * @param fn - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (timeout) {
      clearTimeout(timeout);
    }

    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, delay - (now - lastCall));
    }
  };
}

/**
 * Debounce function execution
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * Token bucket rate limiter
 * More sophisticated than simple counter-based limiting
 */
export class TokenBucketRateLimiter {
  private tokens: Map<string, { count: number; lastRefill: number }> = new Map();

  constructor(
    private readonly capacity: number,
    private readonly refillRate: number, // tokens per second
    private readonly refillIntervalMs: number = 1000
  ) {}

  /**
   * Try to consume tokens
   *
   * @param key - Unique key for the bucket
   * @param tokensNeeded - Number of tokens to consume
   * @returns Whether tokens were available
   */
  consume(key: string, tokensNeeded: number = 1): boolean {
    const now = Date.now();
    const bucket = this.tokens.get(key) || { count: this.capacity, lastRefill: now };

    // Refill tokens based on time elapsed
    const timePassed = now - bucket.lastRefill;
    const intervalsElapsed = Math.floor(timePassed / this.refillIntervalMs);
    const tokensToAdd = intervalsElapsed * this.refillRate;

    bucket.count = Math.min(this.capacity, bucket.count + tokensToAdd);
    bucket.lastRefill = now;

    // Try to consume tokens
    if (bucket.count >= tokensNeeded) {
      bucket.count -= tokensNeeded;
      this.tokens.set(key, bucket);
      return true;
    }

    this.tokens.set(key, bucket);
    return false;
  }

  /**
   * Get current token count
   */
  getTokens(key: string): number {
    const bucket = this.tokens.get(key);
    return bucket?.count || this.capacity;
  }

  /**
   * Reset bucket
   */
  reset(key: string): void {
    this.tokens.delete(key);
  }

  /**
   * Clear all buckets
   */
  clear(): void {
    this.tokens.clear();
  }
}

/**
 * Sliding window rate limiter
 * More accurate than fixed window
 */
export class SlidingWindowRateLimiter {
  private logs: Map<string, number[]> = new Map();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  /**
   * Check and record a request
   *
   * @param key - Unique key
   * @returns Whether request is allowed
   */
  allow(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get and filter old requests
    const requests = (this.logs.get(key) || []).filter((timestamp) => timestamp > windowStart);

    if (requests.length < this.maxRequests) {
      requests.push(now);
      this.logs.set(key, requests);
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests
   */
  getRemaining(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const requests = (this.logs.get(key) || []).filter((timestamp) => timestamp > windowStart);

    return Math.max(0, this.maxRequests - requests.length);
  }

  /**
   * Reset for key
   */
  reset(key: string): void {
    this.logs.delete(key);
  }

  /**
   * Clear all
   */
  clear(): void {
    this.logs.clear();
  }
}
