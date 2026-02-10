/**
 * Simple in-memory rate limiter.
 *
 * In a serverless environment each instance maintains its own store,
 * so this provides per-instance burst protection rather than global limits.
 * For production-grade global rate limiting, use Redis (e.g. Upstash).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup of expired entries (runs once per module instance)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (now > entry.resetAt) store.delete(key);
    });
  }, 60_000);
}

interface RateLimitOptions {
  /** Maximum requests per window. Default: 30 */
  maxRequests?: number;
  /** Window size in milliseconds. Default: 60_000 (1 minute) */
  windowMs?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets (only present when denied) */
  retryAfter?: number;
}

/**
 * Check whether a request identified by `key` (typically an IP) is within limits.
 */
export function rateLimit(
  key: string,
  { maxRequests = 30, windowMs = 60_000 }: RateLimitOptions = {}
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  return { allowed: true, remaining: maxRequests - entry.count };
}

/**
 * Helper: extract a usable IP string from a Next.js request.
 * Falls back to 'unknown' so rate limiting still works (just globally).
 */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
