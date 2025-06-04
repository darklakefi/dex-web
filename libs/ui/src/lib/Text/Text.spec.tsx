import { render } from "@testing-library/react";

import Text from "./Text";

describe("Text", () => {
  it("should render heading", () => {
    const { baseElement } = render(<Text.Heading>Hello</Text.Heading>);
    expect(baseElement).toBeTruthy();
  });

  it("should render body1", () => {
    const { baseElement } = render(<Text.Body1>Hello</Text.Body1>);
    expect(baseElement).toBeTruthy();
  });

  it("should render body2", () => {
    const { baseElement } = render(<Text.Body2>Hello</Text.Body2>);
    expect(baseElement).toBeTruthy();
  });

  it("should render body2 lowercase", () => {
    const { baseElement } = render(
      <Text.Body2 textCase="lowercase">Hello</Text.Body2>,
    );
    expect(baseElement).toHaveClass("lowercase");
  });

  it("should render link", () => {
    const { baseElement } = render(<Text.Link>Hello</Text.Link>);
    expect(baseElement).toBeTruthy();
  });
});
