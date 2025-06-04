/// <reference types="@vitest/browser/context" />
import { render, waitFor } from "@testing-library/react";

import { Icon } from "./Icon";

describe("Icon", () => {
  it("should render successfully without props", async () => {
    const { baseElement } = render(<Icon name="analytics" />);
    await waitFor(() => {
      expect(baseElement).toBeTruthy();
    });
  });

  it("should render successfully with padding and background explicitly set", () => {
    const { baseElement } = render(<Icon name="analytics" />);

    const iconElement = baseElement.querySelector(".size-6");
    expect(iconElement).toBeTruthy();
    expect(iconElement).toHaveClass("text-green-100");
  });

  it("should allow custom props to be passed through", async () => {
    const { baseElement } = render(
      <Icon data-testid="icon" name="analytics" />,
    );
    await waitFor(() => {
      const iconElement = baseElement.querySelector("[data-testid='icon']");
      expect(iconElement).toBeTruthy();
    });
  });
});
