/**
 * Simple in-memory rate limiter for request throttling
 * Note: For production, use Redis or similar distributed cache
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limits
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  // Don't prevent process from exiting
  cleanupInterval.unref();
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Key prefix to namespace different limiters */
  keyPrefix?: string;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Current request count in window */
  current: number;
  /** Maximum allowed requests */
  limit: number;
  /** Time in ms until rate limit resets */
  retryAfterMs: number;
}

/**
 * Check and update rate limit for a given key
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  startCleanup();

  const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;
  const now = Date.now();
  const entry = rateLimitStore.get(fullKey);

  // If no entry or expired, create new
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(fullKey, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      current: 1,
      limit: config.maxRequests,
      retryAfterMs: 0,
    };
  }

  // Increment and check
  entry.count++;
  
  const allowed = entry.count <= config.maxRequests;
  const retryAfterMs = allowed ? 0 : entry.resetAt - now;

  return {
    allowed,
    current: entry.count,
    limit: config.maxRequests,
    retryAfterMs,
  };
}

/**
 * Create a rate limiter with preset config
 */
export function createRateLimiter(config: RateLimitConfig) {
  return (key: string) => checkRateLimit(key, config);
}

// ============================================
// Preset rate limiters
// ============================================

/** Rate limiter for join endpoint: 10 requests per minute per IP */
export const joinRateLimit = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
  keyPrefix: "join",
});

/** Rate limiter for answer endpoint: 30 requests per minute per participant */
export const answerRateLimit = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000,
  keyPrefix: "answer",
});

/** Rate limiter for demo endpoints: 5 requests per minute */
export const demoRateLimit = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000,
  keyPrefix: "demo",
});

/** Rate limiter for host control: 60 requests per minute */
export const hostControlRateLimit = createRateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
  keyPrefix: "hostctl",
});

/**
 * Rate limiter for login attempts: 5 requests per minute per IP
 * Per FR-010: max 5 attempts per minute per IP to mitigate brute-force attacks
 */
export const loginRateLimit = createRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000,
  keyPrefix: "login",
});

/**
 * Get client IP from request headers
 * Handles common proxy scenarios
 */
export function getClientIp(request: Request): string {
  // Check for forwarded header (behind proxy/load balancer)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // Get first IP in the chain (client IP)
    return forwarded.split(",")[0].trim();
  }

  // Check for real IP header (nginx)
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to a default (in serverless environments, this may not work)
  return "unknown";
}

/**
 * Middleware helper to apply rate limiting to a route
 */
export function withRateLimit(
  request: Request,
  key: string,
  limiter: (key: string) => RateLimitResult
): { allowed: boolean; response?: Response } {
  const result = limiter(key);

  if (!result.allowed) {
    const response = new Response(
      JSON.stringify({
        error: "Too many requests",
        retryAfterMs: result.retryAfterMs,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Date.now() + result.retryAfterMs),
        },
      }
    );
    return { allowed: false, response };
  }

  return { allowed: true };
}
