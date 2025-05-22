import { render } from "@testing-library/react";

import ExampleButton from "./ExampleButton";

describe("ExampleButton", () => {
  it("should render successfully", () => {
    const { baseElement } = render(<ExampleButton>Click me</ExampleButton>);
    expect(baseElement).toBeTruthy();
  });
});
