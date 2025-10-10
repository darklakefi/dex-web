import {
  dehydrate,
  HydrationBoundary,
  type QueryClient,
} from "@tanstack/react-query";
import { cache } from "react";
import { createQueryClient } from "./client";

/**
 * Server-side QueryClient factory with React cache.
 * Uses React's cache() to ensure one QueryClient per request.
 */
export const getQueryClient = cache(createQueryClient);

/**
 * HydrateClient component for server-side hydration.
 * Wraps children with dehydrated query state from server.
 *
 * @example
 * ```tsx
 * export default function Page() {
 *   const queryClient = getQueryClient()
 *   await queryClient.prefetchQuery(...)
 *
 *   return (
 *     <HydrateClient client={queryClient}>
 *       <MyComponent />
 *     </HydrateClient>
 *   )
 * }
 * ```
 */
export function HydrateClient(props: {
  children: React.ReactNode;
  client: QueryClient;
}) {
  return (
    <HydrationBoundary state={dehydrate(props.client)}>
      {props.children}
    </HydrationBoundary>
  );
}
