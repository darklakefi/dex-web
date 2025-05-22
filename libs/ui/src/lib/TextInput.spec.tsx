/// <reference types="@vitest/browser/context" />
import { render } from "@testing-library/react";

import { Box } from "./Box";

describe("Box", () => {
  it("should render successfully without props", () => {
    const { baseElement } = render(<Box>Box</Box>);
    expect(baseElement).toBeTruthy();
  });

  it("should render successfully with padding and background explicitly set", () => {
    const { baseElement } = render(
      <Box padding="lg" background="base">
        Box
      </Box>,
    );

    const boxElement = baseElement.querySelector(".p-6");
    expect(boxElement).toBeTruthy();
    expect(boxElement).toHaveClass("bg-green-70");
  });

  it("should allow custom props to be passed through", () => {
    const { baseElement } = render(<Box data-testid="box">Box</Box>);
    const boxElement = baseElement.querySelector("[data-testid='box']");
    expect(boxElement).toBeTruthy();
  });
});
