import { RATE_LIMIT_CONFIG } from "../config/constants";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}
class RateLimiterService {
  private static instance: RateLimiterService;
  private limits = new Map<string, RateLimitEntry>();
  static getInstance(): RateLimiterService {
    if (!RateLimiterService.instance) {
      RateLimiterService.instance = new RateLimiterService();
    }
    return RateLimiterService.instance;
  }
  private getKey(identifier: string, endpoint: string): string {
    return `${identifier}:${endpoint}`;
  }
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
  checkLimit(
    identifier: string,
    endpoint: string,
    maxRequests: number,
    windowMs: number,
  ): { allowed: boolean; remaining: number; resetTime: number } {
    this.cleanup();
    const key = this.getKey(identifier, endpoint);
    const now = Date.now();
    const entry = this.limits.get(key);
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: now + windowMs,
      };
    }
    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }
    entry.count++;
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }
  getLiquidityLimit(identifier: string) {
    return this.checkLimit(
      identifier,
      "liquidity",
      RATE_LIMIT_CONFIG.LIQUIDITY_MAX_REQUESTS,
      RATE_LIMIT_CONFIG.LIQUIDITY_WINDOW_MS,
    );
  }
  getPoolsLimit(identifier: string) {
    return this.checkLimit(
      identifier,
      "pools",
      RATE_LIMIT_CONFIG.POOLS_MAX_REQUESTS,
      RATE_LIMIT_CONFIG.POOLS_WINDOW_MS,
    );
  }
  getTokensLimit(identifier: string) {
    return this.checkLimit(
      identifier,
      "tokens",
      RATE_LIMIT_CONFIG.TOKENS_MAX_REQUESTS,
      RATE_LIMIT_CONFIG.TOKENS_WINDOW_MS,
    );
  }
  getDefaultLimit(identifier: string) {
    return this.checkLimit(
      identifier,
      "default",
      RATE_LIMIT_CONFIG.DEFAULT_MAX_REQUESTS,
      RATE_LIMIT_CONFIG.DEFAULT_WINDOW_MS,
    );
  }
}
export { RateLimiterService };
