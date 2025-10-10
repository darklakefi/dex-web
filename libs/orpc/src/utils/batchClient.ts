import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { BatchLinkPlugin, DedupeRequestsPlugin } from "@orpc/client/plugins";
import type { RouterClient } from "@orpc/server";
import type { ClientContext } from "../client";
import type { appRouter } from "../routers/app.router";

/**
 * Creates a batch-optimized oRPC client for a specific batch group.
 *
 * @param batchGroup - The batch group this client belongs to (read/write/status/metadata)
 * @param options - Configuration options for the batch client
 * @returns A typed oRPC client optimized for batching
 *
 * @example
 * ```ts
 * // Create a read-optimized client with caching
 * const readClient = createBatchClient('read', { cache: 'force-cache' });
 *
 * // Create a write client
 * const writeClient = createBatchClient('write');
 * ```
 */
export function createBatchClient(
  batchGroup: ClientContext["batchGroup"],
  options: {
    url?: string;
    cache?: RequestCache;
    dedupe?: boolean;
  } = {},
): RouterClient<typeof appRouter> {
  const link = new RPCLink<ClientContext>({
    fetch: (request, init, { context }) =>
      globalThis.fetch(request, {
        ...init,
        cache: context?.cache,
      }),
    method: ({ context }) => {
      if (context?.cache === "force-cache" || context?.cache === "default") {
        return "GET";
      }
      return "POST";
    },
    plugins: [
      new DedupeRequestsPlugin({
        filter: ({ request }) => request.method === "GET",
        groups: [
          {
            condition: ({ context }) => context?.cache === "force-cache",
            context: {
              cache: "force-cache",
            },
          },
          {
            condition: ({ context }) => context?.dedupe === true,
            context: {},
          },
          {
            condition: () => true,
            context: { batchGroup, ...options },
          },
        ],
      }),
      new BatchLinkPlugin({
        exclude: ({ path }) => {
          const excludedPaths = [
            "helius/subscribe",
            "liquidity/stream",
            "pools/stream",
          ];
          return excludedPaths.some((excludedPath) =>
            path.join("/").includes(excludedPath),
          );
        },
        groups: [
          {
            condition: () => true,
            context: { batchGroup, ...options },
          },
        ],
        headers: () => ({
          "x-batch-group": batchGroup || "default",
          "x-batch-timestamp": Date.now().toString(),
          "x-client-batch": "true",
        }),
        mode: typeof window === "undefined" ? "buffered" : "streaming",
      }),
    ],
    url:
      options.url ||
      (() => {
        if (typeof window === "undefined") {
          throw new Error("RPCLink is not allowed on the server side.");
        }
        return `${window.location.origin}/rpc`;
      }),
  });

  return createORPCClient(link);
}

/**
 * Pre-configured batch clients for common use cases.
 *
 * @example
 * ```ts
 * // Use the read client for fetching data with caching
 * const pools = await batchClients.read().pools.getAllPools();
 *
 * // Use the metadata client for token metadata with caching
 * const metadata = await batchClients.metadata().tokens.getTokenMetadata({ mint });
 *
 * // Use the write client for mutations
 * await batchClients.write().liquidity.submitAddLiquidity(data);
 * ```
 */
export const batchClients = {
  /** Client for metadata requests with force-cache enabled */
  metadata: () => createBatchClient("metadata", { cache: "force-cache" }),
  /** Client for read operations with force-cache enabled */
  read: () => createBatchClient("read", { cache: "force-cache" }),
  /** Client for status check requests */
  status: () => createBatchClient("status"),
  /** Client for write/mutation operations */
  write: () => createBatchClient("write"),
} as const;
