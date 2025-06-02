/// <reference types="@vitest/browser/context" />
import { render } from "@testing-library/react";

import { Header } from "./Header";

describe("Header", () => {
  it("should render", () => {
    const { baseElement } = render(
      <Header
        logoSm={<div>Logo</div>}
        logoLg={<div>Logo</div>}
        button={<div>Button</div>}
      >
        <div>Box</div>
      </Header>,
    );
    expect(baseElement).toBeTruthy();
  });
});
