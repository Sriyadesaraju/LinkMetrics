import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "../utils/redis";
import { Request, Response, NextFunction } from "express";

// 10 link creations per minute per IP
const shortenLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  prefix: "ratelimit:shorten",
});

// 100 redirects per minute per IP
const redirectLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  prefix: "ratelimit:redirect",
});

export const rateLimitShorten = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
    req.ip ||
    "unknown";

  const { success, limit, remaining, reset } = await shortenLimiter.limit(ip);

  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", reset);

  if (!success) {
    res.status(429).json({
      error: "Too many requests. Please slow down.",
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    });
    return;
  }
  next();
};

export const rateLimitRedirect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
    req.ip ||
    "unknown";

  const { success } = await redirectLimiter.limit(ip);

  if (!success) {
    res.status(429).json({ error: "Too many requests." });
    return;
  }
  next();
};
