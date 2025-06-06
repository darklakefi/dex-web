import { type AppRouter, appRouter, createTRPCContext } from "@dex-web/trpc";
import { cache } from "react";

export const trpcSsr = cache((): ReturnType<AppRouter["createCaller"]> => {
  return appRouter.createCaller(createTRPCContext());
});
