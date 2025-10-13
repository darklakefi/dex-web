import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { act as reactDomAct } from "react-dom/test-utils";

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
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;

afterEach(() => {
  cleanup();
});
