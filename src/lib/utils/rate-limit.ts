/**
 * Rate limiter in-memory para Ola 1 (single pod).
 * Ola 2+: migrar a Upstash Redis.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    retryAfterSeconds: 0,
  };
}

// Cleanup cada 10 min (referenciado desde module init)
if (typeof globalThis !== 'undefined' && !(globalThis as { __tinkuRateLimitCleaner?: boolean }).__tinkuRateLimitCleaner) {
  (globalThis as { __tinkuRateLimitCleaner?: boolean }).__tinkuRateLimitCleaner = true;
  setInterval(() => {
    const now = Date.now();
    Array.from(buckets.entries()).forEach(([key, bucket]) => {
      if (bucket.resetAt < now) buckets.delete(key);
    });
  }, 10 * 60 * 1000).unref?.();
}
