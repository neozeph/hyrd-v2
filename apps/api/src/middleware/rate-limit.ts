import type { RequestHandler } from "express";

type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function secondsUntil(timestamp: number): number {
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
}

export function createRateLimit({
  keyPrefix,
  limit,
  windowMs,
}: RateLimitOptions): RequestHandler {
  return (request, response, next) => {
    const now = Date.now();
    const key = `${keyPrefix}:${request.ip ?? request.socket.remoteAddress ?? "unknown"}`;
    const current = buckets.get(key);
    const bucket =
      current === undefined || current.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : current;

    bucket.count += 1;
    buckets.set(key, bucket);

    response.setHeader("RateLimit-Limit", String(limit));
    response.setHeader("RateLimit-Remaining", String(Math.max(0, limit - bucket.count)));
    response.setHeader("RateLimit-Reset", String(secondsUntil(bucket.resetAt)));

    if (bucket.count > limit) {
      response.setHeader("Retry-After", String(secondsUntil(bucket.resetAt)));
      response.status(429).json({
        error: "Too many requests",
        code: "RATE_LIMITED",
      });
      return;
    }

    next();
  };
}

export function resetRateLimiters(): void {
  buckets.clear();
}
