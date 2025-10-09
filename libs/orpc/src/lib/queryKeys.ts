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
  metadata: (addresses: string[]) =>
    [...tokenQueryKeys.all, "metadata", addresses] as const,
  owner: (address: string) =>
    [...tokenQueryKeys.all, "owner", address] as const,
};

/**
 * Query configuration constants for optimal performance
 */
export const QUERY_CONFIG = {
  tokenDetail: {
    gcTime: 30 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
  },
  tokenOwner: {
    gcTime: 60 * 60 * 1000,
    staleTime: 30 * 60 * 1000,
  },
  tokenSearch: {
    gcTime: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  },
  tokens: {
    gcTime: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  },
} as const;
