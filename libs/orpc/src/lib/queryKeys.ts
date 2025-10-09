/**
 * Centralized query key factory for tokens
 * Provides type-safe and consistent query keys across the application
 */
export const tokenQueryKeys = {
  all: ["tokens"] as const,
  detail: (address: string) => [...tokenQueryKeys.details(), address] as const,
  details: () => [...tokenQueryKeys.all, "detail"] as const,
  list: (filters: {
    query?: string;
    limit?: number;
    offset?: number;
    onlyWithPools?: boolean;
  }) => [...tokenQueryKeys.lists(), filters] as const,
  lists: () => [...tokenQueryKeys.all, "list"] as const,

  /**
   * Metadata-specific query keys for token information (name, symbol, logo)
   * These have longer cache times as metadata rarely changes
   */
  metadata: {
    all: () => ["tokens", "metadata"] as const,
    byAddress: (address: string) =>
      [...tokenQueryKeys.metadata.all(), address] as const,
    byAddresses: (addresses: string[]) =>
      [
        ...tokenQueryKeys.metadata.all(),
        "batch",
        addresses.sort().join(","),
      ] as const,
    poolTokens: () => [...tokenQueryKeys.metadata.all(), "poolTokens"] as const,
  },

  owner: (address: string) =>
    [...tokenQueryKeys.all, "owner", address] as const,

  /**
   * Search-specific query keys for token search results
   * Separate from metadata to allow different cache strategies
   */
  search: {
    all: () => ["tokens", "search"] as const,
    query: (q: string, pageSize: number) =>
      [...tokenQueryKeys.search.all(), q, pageSize] as const,
  },
};

/**
 * Query configuration constants for optimal performance
 * Cache times are tuned based on data volatility:
 * - Metadata: 30min (stable - logos/names rarely change)
 * - Search: 5min (ephemeral - user searches)
 * - Detail: 10min (semi-volatile - includes price data)
 * - Owner: 30min (stable - balances updated separately)
 */
export const QUERY_CONFIG = {
  /**
   * Pool tokens metadata
   * Derived from pools, moderately stable
   */
  poolTokensMetadata: {
    gcTime: 30 * 60 * 1000,
    retry: 2,
    staleTime: 10 * 60 * 1000,
  },

  /**
   * Token detail (includes price and additional metadata)
   * More volatile than pure metadata
   */
  tokenDetail: {
    gcTime: 10 * 60 * 1000,
    retry: 2,
    staleTime: 2 * 60 * 1000,
  },
  /**
   * Token metadata (name, symbol, logo, decimals)
   * Very stable data - aggressive caching
   */
  tokenMetadata: {
    gcTime: 2 * 60 * 60 * 1000,
    retry: 2,
    staleTime: 30 * 60 * 1000,
  },

  tokenOwner: {
    gcTime: 60 * 60 * 1000,
    staleTime: 30 * 60 * 1000,
  },

  /**
   * Token search results
   * Ephemeral data, shorter cache
   */
  tokenSearch: {
    gcTime: 15 * 60 * 1000,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  },

  tokens: {
    gcTime: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  },
} as const;
