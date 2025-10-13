import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import * as React from "react";
import { act } from "react";
import { afterEach } from "vitest";

if (typeof React.act === "undefined") {
  // @ts-expect-error - Adding act to React for test compatibility
  React.act = act;
}

afterEach(() => {
  cleanup();
});
