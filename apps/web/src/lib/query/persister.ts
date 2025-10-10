import type { PersistedQuery } from "@tanstack/query-persist-client-core";
import { experimental_createQueryPersister } from "@tanstack/query-persist-client-core";
import { serializer } from "./serializer";

/**
 * Custom serializer for persisted queries that uses oRPC serializer.
 * This ensures complex data types (Date, BigInt, etc.) are properly persisted
 * and restored from localStorage.
 */
function serializePersistedQuery(persistedQuery: PersistedQuery): string {
  const [json, meta] = serializer.serialize(persistedQuery);
  return JSON.stringify({ json, meta });
}

/**
 * Custom deserializer for persisted queries that uses oRPC serializer.
 */
function deserializePersistedQuery(cachedString: string): PersistedQuery {
  const { json, meta } = JSON.parse(cachedString);
  return serializer.deserialize(json, meta) as PersistedQuery;
}

/**
 * Token metadata persister for long-term caching of token information.
 *
 * Token metadata (names, symbols, logos, decimals) rarely changes, so we can
 * safely cache it for 24 hours. This provides instant token modal loading
 * and reduces API pressure.
 *
 * Use this persister for queries that fetch token metadata by address.
 *
 * IMPORTANT: The persister wraps queryFn and runs it to persist data.
 * Since this happens outside normal TanStack Query flow, the oRPC client
 * may not have the correct operation context, potentially causing HTTP method
 * mismatches (GET vs POST). If you see 405 errors or infinite loops,
 * consider using persister only on queries with explicit context or
 * implementing a custom persister that doesn't re-run queryFn.
 */
export const tokenMetadataPersister = experimental_createQueryPersister({
  buster: "v1",
  deserialize: deserializePersistedQuery,
  maxAge: 1000 * 60 * 60 * 24,
  prefix: "dex-token-metadata",
  serialize: serializePersistedQuery,
  storage: typeof window !== "undefined" ? localStorage : undefined,
});

/**
 * Pool list persister for medium-term caching of pool data.
 *
 * Pool lists change more frequently than token metadata but are still
 * relatively stable. Caching for 1 hour provides good UX while keeping
 * data reasonably fresh.
 *
 * Use this persister for queries that fetch pool lists.
 */
export const poolListPersister = experimental_createQueryPersister({
  buster: "v1",
  deserialize: deserializePersistedQuery,
  maxAge: 1000 * 60 * 60,
  prefix: "dex-pool-list",
  serialize: serializePersistedQuery,
  storage: typeof window !== "undefined" ? localStorage : undefined,
});

/**
 * User data persister for session-based caching.
 *
 * User-specific data like transaction history should be cached for the
 * duration of a session. This provides instant loading on component remounts
 * while ensuring data is fresh across sessions.
 *
 * Use this persister for user-specific queries (requires wallet connection).
 */
export const userDataPersister = experimental_createQueryPersister({
  buster: "v1",
  deserialize: deserializePersistedQuery,
  maxAge: 1000 * 60 * 30,
  prefix: "dex-user-data",
  serialize: serializePersistedQuery,
  storage: typeof window !== "undefined" ? sessionStorage : undefined,
});

/**
 * Cleanup utility to remove expired or malformed entries from storage.
 *
 * Call this periodically (e.g., on app initialization) to prevent localStorage
 * from growing unbounded. This is especially important for token metadata
 * which can accumulate many entries over time.
 *
 * @example
 * ```ts
 * // In your app initialization
 * useEffect(() => {
 *   cleanupPersistedQueries();
 * }, []);
 * ```
 */
export async function cleanupPersistedQueries() {
  if (typeof window === "undefined") return;

  try {
    await Promise.all([
      tokenMetadataPersister.persisterGc(),
      poolListPersister.persisterGc(),
      userDataPersister.persisterGc(),
    ]);
  } catch (error) {
    console.debug("Failed to cleanup persisted queries:", error);
  }
}
