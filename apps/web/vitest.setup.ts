import { setupMockOrpcHandlers } from "@dex-web/orpc/mocks";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  setupMockOrpcHandlers();
  cleanup();
});
