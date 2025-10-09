/**
 * Token search and prefetch configuration constants
 */

/**
 * Maximum number of tokens to fetch from the backend for search functionality.
 * This allows the search to filter through a large pool of tokens.
 */
export const TOKEN_SEARCH_FETCH_SIZE = 10000;

/**
 * Maximum number of tokens to display in the UI.
 * Keeps the interface clean and performant.
 */
export const TOKEN_SEARCH_DISPLAY_SIZE = 8;

/**
 * Delay before starting prefetch operations (in milliseconds).
 * Used as fallback when requestIdleCallback is not available.
 */
export const PREFETCH_DELAY_MS = 100;

/**
 * Popular token symbols to prefetch for instant search results.
 */
export const POPULAR_TOKEN_SEARCHES = ["SOL", "USDC", "USDT"] as const;
