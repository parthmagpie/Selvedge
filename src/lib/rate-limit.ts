// Simple in-memory rate limiter for API routes
// For production, use a Redis-backed solution

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export function rateLimit(identifier: string, options: RateLimitOptions): boolean {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(identifier, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return true;
  }

  if (entry.count >= options.maxRequests) {
    // Rate limit exceeded
    return false;
  }

  // Increment count
  entry.count++;
  return true;
}
