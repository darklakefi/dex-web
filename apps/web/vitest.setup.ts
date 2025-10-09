import { vi } from "vitest";

vi.mock("../../libs/utils/src/blockchain/sortSolanaAddresses.ts", () => ({
  sortSolanaAddresses: (addrA: string, addrB: string) => {
    const sorted = [addrA, addrB].sort();
    return {
      tokenXAddress: sorted[0] as string,
      tokenYAddress: sorted[1] as string,
    };
  },
  sortTokenPublicKeys: <T>(keyA: T, keyB: T): [T, T] => {
    const comparison = String(keyA).localeCompare(String(keyB));
    return comparison <= 0 ? [keyA, keyB] : [keyB, keyA];
  },
}));

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

import "./src/app/__mocks__/hooks";
import "./src/app/__mocks__/orpc";

Object.defineProperty(window, "focus", {
  value: () => {},
  writable: true,
});

Object.defineProperty(HTMLElement.prototype, "focus", {
  configurable: true,
  value: () => {},
  writable: true,
});

afterEach(() => {
  cleanup();
});
