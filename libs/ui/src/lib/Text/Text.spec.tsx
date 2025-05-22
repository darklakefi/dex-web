import { render } from "@testing-library/react";

import Text from "./index";

describe("Text", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<Text.Body>Hello</Text.Body>);
    expect(baseElement).toBeTruthy();
  });

  it("should render heading", () => {
    const { baseElement } = render(<Text.Heading>Hello</Text.Heading>);
    expect(baseElement).toBeTruthy();
  });

  it("should render heading1", () => {
    const { baseElement } = render(<Text.Heading1>Hello</Text.Heading1>);
    expect(baseElement).toBeTruthy();
  });

  it("should render body", () => {
    const { baseElement } = render(<Text.Body>Hello</Text.Body>);
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

  it("should render link", () => {
    const { baseElement } = render(<Text.Link>Hello</Text.Link>);
    expect(baseElement).toBeTruthy();
  });
});
