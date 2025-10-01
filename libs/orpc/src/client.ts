import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { BatchLinkPlugin, DedupeRequestsPlugin } from "@orpc/client/plugins";
import type { RouterClient } from "@orpc/server";
import {
  createTanstackQueryUtils,
  type RouterUtils,
} from "@orpc/tanstack-query";
import type { appRouter } from "./routers/app.router";

declare global {
  var $client: RouterClient<typeof appRouter> | undefined;
}

export interface ClientContext {
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
          context: {},
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
          condition: ({ context, request }) =>
            context?.batchGroup === "read" ||
            (request.method === "GET" &&
              ["tokens", "pools", "helius"].some((path) =>
                request.url.toString().includes(`/${path}/`),
              )),
          context: { batchGroup: "read" as const },
        },
        {
          condition: ({ context, request }) =>
            context?.batchGroup === "status" ||
            request.url.toString().includes("/check") ||
            request.url.toString().includes("/status"),
          context: { batchGroup: "status" as const },
        },
        {
          condition: ({ context, request }) =>
            context?.batchGroup === "metadata" ||
            request.url.toString().includes("/metadata") ||
            request.url.toString().includes("/details"),
          context: { batchGroup: "metadata" as const },
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
      mode: typeof window === "undefined" ? "buffered" : "streaming",
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

export function createClientWithContext(context: ClientContext = {}) {
  const contextualLink = new RPCLink<ClientContext>({
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
            context,
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
            condition: ({ context: ctx, request }) =>
              ctx?.batchGroup === "read" ||
              (request.method === "GET" &&
                ["tokens", "pools", "helius"].some((path) =>
                  request.url.toString().includes(`/${path}/`),
                )),
            context: { ...context, batchGroup: "read" as const },
          },
          {
            condition: ({ context: ctx, request }) =>
              ctx?.batchGroup === "status" ||
              request.url.toString().includes("/check") ||
              request.url.toString().includes("/status"),
            context: { ...context, batchGroup: "status" as const },
          },
          {
            condition: ({ context: ctx, request }) =>
              ctx?.batchGroup === "metadata" ||
              request.url.toString().includes("/metadata") ||
              request.url.toString().includes("/details"),
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
        mode: typeof window === "undefined" ? "buffered" : "streaming",
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
