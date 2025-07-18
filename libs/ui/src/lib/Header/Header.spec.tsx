/// <reference types="@vitest/browser/context" />
import { render } from "@testing-library/react";

import { Header } from "./Header";

describe("Header", () => {
  it("should render", () => {
    const { baseElement } = render(
      <Header
        button={<div>Button</div>}
        logoLg={<div>Logo</div>}
        logoSm={<div>Logo</div>}
      >
        <div>Box</div>
      </Header>,
    );
    expect(baseElement).toBeTruthy();
  });
});
