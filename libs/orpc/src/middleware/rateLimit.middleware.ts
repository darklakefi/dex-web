import { os } from "@orpc/server";
import { z } from "zod";
import { RATE_LIMIT_CONFIG } from "../config/constants";
import { RateLimiterService } from "../services/RateLimiterService";

interface ServerContext {
  headers?: Record<string, string>;
  userAddress?: string;
  ip?: string;
}

const getIdentifierFromContext = (context: ServerContext): string => {
  return context.userAddress || context.ip || "anonymous";
};

const rateLimitErrors = {
  RATE_LIMITED: {
    data: z.object({
      limit: z.number(),
      remaining: z.number(),
      retryAfter: z.number(),
    }),
    message: "Rate limit exceeded",
  },
};
export const rateLimitMiddleware = os
  .errors(rateLimitErrors)
  .middleware(async ({ next, context, errors }) => {
    const rateLimiter = RateLimiterService.getInstance();
    const identifier = getIdentifierFromContext(context as ServerContext);
    const limit = rateLimiter.getDefaultLimit(identifier);
    if (!limit.allowed) {
      throw errors.RATE_LIMITED({
        data: {
          limit: RATE_LIMIT_CONFIG.DEFAULT_MAX_REQUESTS,
          remaining: limit.remaining,
          retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000),
        },
        message: "Rate limit exceeded",
      });
    }
    return next();
  });
export const liquidityRateLimitMiddleware = os
  .errors(rateLimitErrors)
  .middleware(async ({ next, context, errors }) => {
    const rateLimiter = RateLimiterService.getInstance();
    const identifier = getIdentifierFromContext(context as ServerContext);
    const limit = rateLimiter.getLiquidityLimit(identifier);
    if (!limit.allowed) {
      throw errors.RATE_LIMITED({
        data: {
          limit: RATE_LIMIT_CONFIG.LIQUIDITY_MAX_REQUESTS,
          remaining: limit.remaining,
          retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000),
        },
        message: "Liquidity rate limit exceeded",
      });
    }
    return next();
  });
export const poolsRateLimitMiddleware = os
  .errors(rateLimitErrors)
  .middleware(async ({ next, context, errors }) => {
    const rateLimiter = RateLimiterService.getInstance();
    const identifier = getIdentifierFromContext(context as ServerContext);
    const limit = rateLimiter.getPoolsLimit(identifier);
    if (!limit.allowed) {
      throw errors.RATE_LIMITED({
        data: {
          limit: RATE_LIMIT_CONFIG.POOLS_MAX_REQUESTS,
          remaining: limit.remaining,
          retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000),
        },
        message: "Pools rate limit exceeded",
      });
    }
    return next();
  });
export const tokensRateLimitMiddleware = os
  .errors(rateLimitErrors)
  .middleware(async ({ next, context, errors }) => {
    const rateLimiter = RateLimiterService.getInstance();
    const identifier = getIdentifierFromContext(context as ServerContext);
    const limit = rateLimiter.getTokensLimit(identifier);
    if (!limit.allowed) {
      throw errors.RATE_LIMITED({
        data: {
          limit: RATE_LIMIT_CONFIG.TOKENS_MAX_REQUESTS,
          remaining: limit.remaining,
          retryAfter: Math.ceil((limit.resetTime - Date.now()) / 1000),
        },
        message: "Tokens rate limit exceeded",
      });
    }
    return next();
  });
