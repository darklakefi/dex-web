import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";

// Import global mocks
import "./src/app/__mocks__/hooks";
import "./src/app/__mocks__/orpc";

// Mock window.focus to avoid React Aria focus errors
Object.defineProperty(window, 'focus', {
  value: () => {},
  writable: true
});

// Mock HTMLElement.focus for React Aria compatibility
Object.defineProperty(HTMLElement.prototype, 'focus', {
  value: () => {
  },
  writable: true,
  configurable: true
});

afterEach(() => {
  cleanup();
});
