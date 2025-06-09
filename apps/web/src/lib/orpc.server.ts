"server only";

import { router } from "@dex-web/orpc";
import { createRouterClient } from "@orpc/server";
import { headers as getHeaders } from "next/headers";

const headers = await getHeaders();

globalThis.$client = createRouterClient(router, {
  /**
   * Provide initial context if needed.
   *
   * Because this client instance is shared across all requests,
   * only include context that's safe to reuse globally.
   * For per-request context, use middleware context or pass a function as the initial context.
   */
  context: async () => ({
    headers: Object.fromEntries(headers.entries()),
  }),
});
