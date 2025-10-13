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
import * as React from "react";
import { act as reactDomAct } from "react-dom/test-utils";

import "./src/app/__mocks__/hooks";
import "./src/app/__mocks__/orpc";

if (typeof React.act === "undefined") {
  // @ts-expect-error - Adding act to React for test compatibility
  React.act = reactDomAct;
}

Object.defineProperty(window, "focus", {
  value: () => {},
  writable: true,
});

Object.defineProperty(HTMLElement.prototype, "focus", {
  configurable: true,
  value: () => {},
  writable: true,
});

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

afterEach(() => {
  cleanup();
});
