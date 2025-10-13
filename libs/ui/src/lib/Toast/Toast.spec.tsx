/// <reference types="@vitest/browser/context" />
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Toast } from "./Toast";

describe("Toast", () => {
  afterEach(() => {
    cleanup();
  });

  it("should render successfully without props", () => {
    render(
      <Toast
        data-testid="toast"
        description="Description"
        onClose={() => {}}
        title="Title"
      />,
    );
    expect(screen.getByTestId("toast")).toBeTruthy();
  });

  it("should render successfully with actions", () => {
    render(
      <Toast
        actions={[{ label: "Action", onClick: () => {} }]}
        data-testid="toast"
        description="Description"
        onClose={() => {}}
        title="Title"
      />,
    );
    expect(screen.getByTestId("toast")).toBeTruthy();
  });

  it("should render successfully with loading", () => {
    render(
      <Toast
        data-testid="toast"
        description="Description"
        onClose={() => {}}
        title="Title"
        variant="loading"
      />,
    );
    expect(screen.getByTestId("toast")).toBeTruthy();
  });
});
