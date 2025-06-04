/// <reference types="@vitest/browser/context" />
import { render } from "@testing-library/react";

import { Footer } from "./Footer";

describe("Footer", () => {
  it("should render", () => {
    const { baseElement } = render(
      <Footer logo={<div>Logo</div>} socialMediaLinks={<div>Button</div>}>
        <div>Box</div>
      </Footer>,
    );
    expect(baseElement).toBeTruthy();
  });
});
