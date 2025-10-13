import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import * as React from "react";

if (typeof React.act === "undefined") {
  // @ts-expect-error - Polyfilling React.act for compatibility
  React.act = (callback: () => void | Promise<void>) => {
    const result = callback();
    if (result && typeof result.then === "function") {
      return result;
    }
    return Promise.resolve();
  };
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
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;

afterEach(() => {
  cleanup();
});
