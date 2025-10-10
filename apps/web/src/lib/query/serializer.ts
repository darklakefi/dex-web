import { StandardRPCJsonSerializer } from "@orpc/client/standard";

/**
 * oRPC serializer for proper hydration support.
 * This ensures complex data types (Date, BigInt, etc.) are properly serialized/deserialized
 * during SSR/SSG and client-side hydration.
 */
export const serializer = new StandardRPCJsonSerializer({
  customJsonSerializers: [],
});
