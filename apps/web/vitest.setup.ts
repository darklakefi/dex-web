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
