import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { BatchLinkPlugin, DedupeRequestsPlugin } from "@orpc/client/plugins";
import type { RouterClient } from "@orpc/server";
import type { ClientContext } from "../client";
import type { appRouter } from "../routers/app.router";

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

export const batchClients = {
  metadata: () => createBatchClient("metadata", { cache: "force-cache" }),
  read: () => createBatchClient("read", { cache: "force-cache" }),
  status: () => createBatchClient("status"),
  write: () => createBatchClient("write"),
} as const;
