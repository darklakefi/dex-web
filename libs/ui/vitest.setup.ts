import { cleanup } from "@testing-library/react";
import * as React from "react";
import { act as reactDomAct } from "react-dom/test-utils";
import { afterEach } from "vitest";

if (typeof React.act === "undefined") {
  // @ts-expect-error - Adding act to React for test compatibility
  React.act = reactDomAct;
}

afterEach(() => {
  cleanup();
});
