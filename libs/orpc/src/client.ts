import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { BatchLinkPlugin, DedupeRequestsPlugin } from "@orpc/client/plugins";
import type { RouterClient } from "@orpc/server";
import {
  createTanstackQueryUtils,
  type RouterUtils,
  type TanstackQueryOperationContext,
} from "@orpc/tanstack-query";
import type { appRouter } from "./routers/app.router";

declare global {
  var $client: RouterClient<typeof appRouter> | undefined;
  var EdgeRuntime: string | undefined;
}

/**
 * Client context for configuring request behavior.
 *
 * Extends TanstackQueryOperationContext to support automatic HTTP method selection
 * based on operation type (query, mutation, etc.) from TanStack Query.
 *
 * @property cache - RequestCache mode for fetch API (e.g., 'force-cache', 'no-cache')
 * @property dedupe - Enable request deduplication for this request
 * @property batchGroup - Group requests for batching optimization
 */
export interface ClientContext extends TanstackQueryOperationContext {
  cache?: RequestCache;
  dedupe?: boolean;
  batchGroup?: "read" | "write" | "status" | "metadata";
}

const link = new RPCLink<ClientContext>({
  fetch: (request, init, { context }) =>
    globalThis.fetch(request, {
      ...init,
      cache: context?.cache,
    }),
  method: () => {
    return "POST";
  },
  plugins: [
    new DedupeRequestsPlugin({
      filter: () => false,
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
          context: {},
        },
      ],
    }),
    new BatchLinkPlugin({
      exclude: () => {
        return true;
      },
      groups: [
        {
          condition: ({ context, request }) =>
            context?.batchGroup === "read" ||
            (request.method === "GET" &&
              ["tokens", "pools", "helius", "liquidity", "swap"].some((path) =>
                request.url.toString().includes(`/${path}/`),
              )),
          context: {
            batchGroup: "read" as const,
            cache: "force-cache" as RequestCache,
          },
        },
        {
          condition: ({ context, request }) =>
            context?.batchGroup === "status" ||
            request.url.toString().includes("/checkTradeStatus") ||
            request.url.toString().includes("/getTransactionStatus") ||
            request.url.toString().includes("/check") ||
            request.url.toString().includes("/status"),
          context: {
            batchGroup: "status" as const,
            cache: "force-cache" as RequestCache,
          },
        },
        {
          condition: ({ context, request }) =>
            context?.batchGroup === "metadata" ||
            request.url.toString().includes("/metadata") ||
            request.url.toString().includes("/details") ||
            request.url.toString().includes("/dexGateway/") ||
            request.url.toString().includes("/integrations/"),
          context: {
            batchGroup: "metadata" as const,
            cache: "force-cache" as RequestCache,
          },
        },
        {
          condition: ({ context, request }) =>
            context?.batchGroup === "write" ||
            ["POST", "PUT", "PATCH", "DELETE"].includes(request.method),
          context: { batchGroup: "write" as const },
        },
        {
          condition: () => true,
          context: {},
        },
      ],
      headers: () => ({
        "x-batch-timestamp": Date.now().toString(),
        "x-client-batch": "true",
      }),
      mode: (() => {
        if (typeof window !== "undefined") {
          return "streaming";
        }

        if (typeof globalThis.EdgeRuntime !== "undefined") {
          return "streaming";
        }

        return "buffered";
      })(),
    }),
  ],
  url: () => {
    if (typeof window === "undefined") {
      throw new Error("RPCLink is not allowed on the server side.");
    }

    return `${window.location.origin}/rpc`;
  },
});

export const client: RouterClient<typeof appRouter> =
  globalThis.$client ?? createORPCClient(link);

export const tanstackClient: RouterUtils<typeof client> =
  createTanstackQueryUtils(globalThis.$client ?? client);

/**
 * Creates an oRPC client with a specific context applied to all requests.
 *
 * @param context - Default context to apply to all requests made with this client
 * @returns A typed oRPC client with the context pre-applied
 *
 * @example
 * ```ts
 * // Create a client with force-cache enabled
 * const cachedClient = createClientWithContext({ cache: 'force-cache' });
 *
 * // Create a client with deduplication enabled
 * const dedupedClient = createClientWithContext({ dedupe: true });
 * ```
 */
export function createClientWithContext(context: ClientContext = {}) {
  const contextualLink = new RPCLink<ClientContext>({
    fetch: (request, init, { context }) =>
      globalThis.fetch(request, {
        ...init,
        cache: context?.cache,
      }),
    method: ({ context }) => {
      return "POST";
    },
    plugins: [
      new DedupeRequestsPlugin({
        filter: () => false,
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
            context,
          },
        ],
      }),
      new BatchLinkPlugin({
        exclude: () => {
          return true;
        },
        groups: [
          {
            condition: ({ context: ctx, request }) =>
              ctx?.batchGroup === "read" ||
              (request.method === "GET" &&
                ["tokens", "pools", "helius", "liquidity", "swap"].some(
                  (path) => request.url.toString().includes(`/${path}/`),
                )),
            context: { ...context, batchGroup: "read" as const },
          },
          {
            condition: ({ context: ctx, request }) =>
              ctx?.batchGroup === "status" ||
              request.url.toString().includes("/checkTradeStatus") ||
              request.url.toString().includes("/getTransactionStatus") ||
              request.url.toString().includes("/check") ||
              request.url.toString().includes("/status"),
            context: { ...context, batchGroup: "status" as const },
          },
          {
            condition: ({ context: ctx, request }) =>
              ctx?.batchGroup === "metadata" ||
              request.url.toString().includes("/metadata") ||
              request.url.toString().includes("/details") ||
              request.url.toString().includes("/dexGateway/") ||
              request.url.toString().includes("/integrations/"),
            context: { ...context, batchGroup: "metadata" as const },
          },
          {
            condition: ({ context: ctx, request }) =>
              ctx?.batchGroup === "write" ||
              ["POST", "PUT", "PATCH", "DELETE"].includes(request.method),
            context: { ...context, batchGroup: "write" as const },
          },
          {
            condition: () => true,
            context,
          },
        ],
        headers: () => ({
          "x-batch-timestamp": Date.now().toString(),
          "x-client-batch": "true",
        }),
        mode: (() => {
          if (typeof window !== "undefined") {
            return "streaming";
          }

          if (typeof globalThis.EdgeRuntime !== "undefined") {
            return "streaming";
          }

          return "buffered";
        })(),
      }),
    ],
    url: () => {
      if (typeof window === "undefined") {
        throw new Error("RPCLink is not allowed on the server side.");
      }
      return `${window.location.origin}/rpc`;
    },
  });

  return createORPCClient(contextualLink);
}
