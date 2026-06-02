/**
 * In-memory sliding-window rate limiter.
 *
 * Works in the Next.js Node.js runtime (not Edge).
 * State is per-process — for multi-instance deployments, use Redis instead.
 *
 * Usage:
 *   const limiter = new RateLimiter({ windowMs: 15 * 60 * 1000, max: 5 });
 *   const result = limiter.check(ip);
 *   if (!result.allowed) return rateLimitResponse();
 */

type RateLimitEntry = {
  timestamps: number[];
  lastClean: number;
};

type RateLimiterOptions = {
  /** Window size in milliseconds */
  windowMs: number;
  /** Max requests allowed within the window */
  max: number;
};

export type RateLimitResult = {
  allowed: boolean;
  /** Remaining requests in the current window */
  remaining: number;
  /** Unix ms timestamp when the oldest request in window expires */
  resetAt: number;
};

export class RateLimiter {
  private readonly windowMs: number;
  private readonly max: number;
  private readonly store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.max = options.max;

    // Run periodic cleanup every 5 minutes to prevent unbounded memory growth
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      // Don't keep Node.js process alive just for cleanup
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let entry = this.store.get(identifier);
    if (!entry) {
      entry = { timestamps: [], lastClean: now };
      this.store.set(identifier, entry);
    }

    // Remove timestamps outside the current window
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    const count = entry.timestamps.length;
    const allowed = count < this.max;

    if (allowed) {
      entry.timestamps.push(now);
    }

    const oldest = entry.timestamps[0] ?? now;
    const resetAt = oldest + this.windowMs;

    return {
      allowed,
      remaining: Math.max(0, this.max - entry.timestamps.length),
      resetAt,
    };
  }

  /** Remove all expired entries from the store */
  private cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, entry] of this.store.entries()) {
      const active = entry.timestamps.filter((ts) => ts > windowStart);
      if (active.length === 0) {
        this.store.delete(key);
      } else {
        entry.timestamps = active;
      }
    }
  }
}

/**
 * Pre-configured rate limiters for common endpoints.
 * These are module-level singletons so state persists across requests
 * within the same server process.
 */

/** 5 login attempts per 15 minutes per IP */
export const loginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

/** 3 registration attempts per hour per IP */
export const registerRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
});

/** 10 checkout attempts per hour per user */
export const checkoutRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
});

/** 5 coupon validation attempts per 10 minutes per user */
export const couponRateLimiter = new RateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 5,
});

/** 3 return requests per hour per user */
export const returnRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
});

/**
 * Extract the real IP from a Next.js request.
 * Checks common proxy headers before falling back to a placeholder.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Build a standard 429 Too Many Requests response.
 */
export function rateLimitResponse(resetAt: number) {
  const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Reset": String(resetAt),
      },
    },
  );
}
