import { RPCHandler } from "@orpc/server/fetch";
import { BatchHandlerPlugin, CORSPlugin } from "@orpc/server/plugins";
import { appRouter } from "./routers/app.router";

export const rpcHandler = new RPCHandler(appRouter, {
  plugins: [
    new CORSPlugin({
      allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
      origin: (origin) => origin,
    }),
    new BatchHandlerPlugin({
      headers: (responses) => ({
        "x-batch-count": responses.length.toString(),
        "x-batch-timestamp": Date.now().toString(),
      }),
    }),
  ],
});
