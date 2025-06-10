import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Mock minimal crypto API required by Solana
Object.defineProperty(globalThis, "crypto", {
  value: {
    getRandomValues: () => new Uint8Array(32),
    randomUUID: () => "00000000-0000-0000-0000-000000000000",
    subtle: { digest: vi.fn() } as unknown as SubtleCrypto,
  } as unknown as Crypto,
});

// Mock process.env.NETWORK
process.env.NETWORK = "devnet";

afterEach(() => {
  cleanup();
});
