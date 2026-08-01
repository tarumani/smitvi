import { RateLimitError } from "@/domain/shared/errors";

type Bucket = {
  count: number;
  resetAt: number;
};

/**
 * In-process fixed-window rate limiter.
 * Replace with Redis/Upstash adapter in production multi-instance deploys.
 */
export class MemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number,
  ) {}

  consume(key: string): void {
    const now = Date.now();
    const current = this.buckets.get(key);

    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }

    if (current.count >= this.maxRequests) {
      throw new RateLimitError();
    }

    current.count += 1;
  }
}

const globalForRateLimit = globalThis as unknown as {
  smitviRateLimiter: MemoryRateLimiter | undefined;
};

export function getRateLimiter(): MemoryRateLimiter {
  if (!globalForRateLimit.smitviRateLimiter) {
    const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
    const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 60);
    globalForRateLimit.smitviRateLimiter = new MemoryRateLimiter(
      windowMs,
      maxRequests,
    );
  }
  return globalForRateLimit.smitviRateLimiter;
}
