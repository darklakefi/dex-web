import { render } from "@testing-library/react";

import Typography from "./index";

describe("Typography", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<Typography.Body>Hello</Typography.Body>);
    expect(baseElement).toBeTruthy();
  });

  it("should render heading", () => {
    const { baseElement } = render(
      <Typography.Heading>Hello</Typography.Heading>,
    );
    expect(baseElement).toBeTruthy();
  });
});
