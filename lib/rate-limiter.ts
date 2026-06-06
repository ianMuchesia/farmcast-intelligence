/**
 * lib/rate-limiter.ts
 *
 * In-memory IP rate limiter. Singleton pattern — same module instance
 * is shared across all hot-reload cycles within a single process.
 *
 * Two exported limiters with different quotas:
 *   weatherLimiter: 30 req/hour — cheap reads, higher allowance
 *   treeLimiter:    10 req/hour — expensive CV+AI pipeline, tighter
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix ms timestamp of when the window resets
}

const CLEANUP_THRESHOLD = 10_000;

class IpRateLimiter {
  private store = new Map<string, RateLimitEntry>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  check(ip: string): RateLimitResult {
    const now = Date.now();

    // Periodic cleanup — prevents unbounded memory growth
    if (this.store.size > CLEANUP_THRESHOLD) {
      this.cleanup(now);
    }

    const entry = this.store.get(ip);

    // New IP — first request, always allowed
    if (!entry) {
      this.store.set(ip, { count: 1, windowStart: now });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: now + this.windowMs,
      };
    }

    const windowExpired = now - entry.windowStart >= this.windowMs;

    // Window has expired — reset and allow
    if (windowExpired) {
      const newEntry: RateLimitEntry = { count: 1, windowStart: now };
      this.store.set(ip, newEntry);
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: now + this.windowMs,
      };
    }

    // Within window — increment and check
    entry.count += 1;
    const resetAt = entry.windowStart + this.windowMs;

    if (entry.count > this.maxRequests) {
      return { allowed: false, remaining: 0, resetAt };
    }

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetAt,
    };
  }

  private cleanup(now: number): void {
    for (const [ip, entry] of this.store.entries()) {
      if (now - entry.windowStart >= this.windowMs) {
        this.store.delete(ip);
      }
    }
  }
}

// 30 requests per hour per IP — weather fetches (cheap, read-only)
export const weatherLimiter = new IpRateLimiter(30, 60 * 60 * 1000);

// 10 requests per hour per IP — tree analysis (expensive: CV + Gemini pipeline)
export const treeLimiter = new IpRateLimiter(10, 60 * 60 * 1000);
