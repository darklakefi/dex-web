/// <reference types="@vitest/browser/context" />
import { render } from "@testing-library/react";

import { PageLayout } from "./PageLayout";

describe("PageLayout", () => {
  it("should render", () => {
    const { baseElement } = render(
      <PageLayout logo={<div>Logo</div>} socialMediaLinks={<div>Button</div>}>
        <div>Box</div>
      </PageLayout>,
    );
    expect(baseElement).toBeTruthy();
  });
});
