import { RPCHandler } from "@orpc/server/fetch";
import { CORSPlugin } from "@orpc/server/plugins";
import { appRouter } from "./routers/app.router";

export const rpcHandler = new RPCHandler(appRouter, {
  plugins: [
    new CORSPlugin({
      allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
      origin: (origin) => origin,
    }),
  ],
});
