/**
 * Shared constants for token and pool queries.
 */

/**
 * Popular tokens that should always be available as fallback.
 * These are common tokens that users frequently trade.
 *
 * Used by:
 * - usePoolTokens
 * - useInfinitePoolTokens
 */
import { SOL_TOKEN_ADDRESS, WSOL_TOKEN_ADDRESS } from "@dex-web/utils";

export const POPULAR_TOKEN_ADDRESSES = [
  SOL_TOKEN_ADDRESS,
  WSOL_TOKEN_ADDRESS,
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
];

/**
 * Maximum number of pool tokens to fetch in a single request.
 * This prevents DDOS-like traffic from fetching thousands of tokens at once.
 * Most users only interact with a small subset of available tokens.
 */
export const MAX_POOL_TOKENS_TO_FETCH = 500;

/**
 * Token search display size (visible results in UI).
 */
export const TOKEN_SEARCH_DISPLAY_SIZE = 8;

/**
 * Token search fetch size (total results fetched from API).
 */
export const TOKEN_SEARCH_FETCH_SIZE = 10000;

/**
 * Delay before triggering prefetch operations (in milliseconds).
 * This gives the browser time to complete critical rendering before
 * starting background prefetching operations.
 */
export const PREFETCH_DELAY_MS = 1000;

/**
 * Popular token search terms that should be prefetched in the background
 * when the SelectTokenModal is opened. These are common tokens users
 * frequently search for.
 *
 * Updated to include both SOL and WSOL as separate search terms.
 */
export const POPULAR_TOKEN_SEARCHES = [
  "SOL",
  "WSOL",
  "USDC",
  "USDT",
  "BONK",
  "WIF",
  "JUP",
];
