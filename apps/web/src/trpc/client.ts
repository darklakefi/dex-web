import type { AppRouter } from "@dex-web/trpc";
import { getBaseUrl } from "@dex-web/utils";
import { loggerLink } from "@trpc/client";
import {
  experimental_createActionHook,
  experimental_createTRPCNextAppDirClient,
  experimental_serverActionLink,
} from "@trpc/next/app-dir/client";
import { experimental_nextHttpLink } from "@trpc/next/app-dir/links/nextHttp";
import superjson from "superjson";

export const api: ReturnType<
  typeof experimental_createTRPCNextAppDirClient<AppRouter>
> = experimental_createTRPCNextAppDirClient<AppRouter>({
  config() {
    return {
      links: [
        loggerLink({
          enabled: (op) => true,
        }),
        experimental_nextHttpLink({
          transformer: superjson,
          batch: true,
          url: getBaseUrl(),
          headers() {
            return {
              "x-trpc-source": "client",
            };
          },
        }),
      ],
    };
  },
});

export const useAction: ReturnType<
  typeof experimental_createActionHook<AppRouter>
> = experimental_createActionHook<AppRouter>({
  links: [
    loggerLink(),
    experimental_serverActionLink({
      transformer: superjson,
    }),
  ],
});
