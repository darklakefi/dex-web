import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";
import { serializer } from "./serializer";

/**
 * Creates a new QueryClient instance with proper oRPC serialization support.
 * This ensures consistent behavior between server and client hydration.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      dehydrate: {
        serializeData(data) {
          const [json, meta] = serializer.serialize(data);
          return { json, meta };
        },
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData(data) {
          return serializer.deserialize(data.json, data.meta);
        },
      },
      queries: {
        queryKeyHashFn(queryKey) {
          const [json, meta] = serializer.serialize(queryKey);
          return JSON.stringify({ json, meta });
        },
        staleTime: 60 * 1000,
      },
    },
  });
}
