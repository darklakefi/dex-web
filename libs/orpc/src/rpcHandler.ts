import { CompressionPlugin, RPCHandler } from "@orpc/server/fetch";
import { BatchHandlerPlugin, CORSPlugin } from "@orpc/server/plugins";
import { appRouter } from "./routers/app.router";

/**
 * RPC Handler with compression, CORS, and batching support.
 *
 * Plugins are executed in order:
 * 1. CORSPlugin - Handles CORS headers for cross-origin requests
 * 2. CompressionPlugin - Compresses response bodies to reduce bandwidth
 * 3. BatchHandlerPlugin - Batches multiple requests into a single response
 */
export const rpcHandler = new RPCHandler(appRouter, {
  plugins: [
    new CORSPlugin({
      allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
      origin: (origin) => origin,
    }),
    new CompressionPlugin({
      encodings: ["gzip", "deflate"],
      threshold: 1024,
    }),
    new BatchHandlerPlugin({
      headers: (responses) => ({
        "x-batch-count": responses.length.toString(),
        "x-batch-timestamp": Date.now().toString(),
      }),
    }),
  ],
});
