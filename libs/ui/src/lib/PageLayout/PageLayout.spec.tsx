/// <reference types="@vitest/browser/context" />
import { render } from "@testing-library/react";

import { Footer } from "../Footer/Footer";
import { Default as FooterDefault } from "../Footer/Footer.stories";
import { Header } from "../Header/Header";
import { Default as HeaderDefault } from "../Header/Header.stories";

import Text from "../Text/Text";
import { PageLayout, backgroundImage } from "./PageLayout";
describe("PageLayout", () => {
  it("should render", () => {
    const { baseElement } = render(
      <PageLayout
        header={<Header {...HeaderDefault.args} />}
        footer={<Footer {...FooterDefault.args} />}
        backgroundImageUrl={backgroundImage}
      >
        <Text>Box</Text>
      </PageLayout>,
    );
    expect(baseElement).toBeTruthy();
  });
});
