import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";

afterEach(() => {
  cleanup();
});

beforeAll(() => {
  vi.stubGlobal("fetch", async (input: RequestInfo) => {
    if (typeof input === "string" && input.startsWith("/rpc/")) {
      return new Response(JSON.stringify({}), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error(`Unexpected fetch call: ${input}`);
  });
});
