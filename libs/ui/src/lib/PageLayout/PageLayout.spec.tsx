/// <reference types="@vitest/browser/context" />
import { render } from "@testing-library/react";

import { Footer } from "../Footer/Footer";
import { Default as FooterDefault } from "../Footer/Footer.stories";
import { Header } from "../Header/Header";
import { Default as HeaderDefault } from "../Header/Header.stories";
import { Text } from "../Text/Text";
import { backgroundImage, PageLayout } from "./PageLayout";

describe("PageLayout", () => {
  it("should render", () => {
    const { baseElement } = render(
      <PageLayout
        backgroundImageUrl={backgroundImage}
        footer={<Footer {...FooterDefault.args} />}
        header={<Header {...HeaderDefault.args} />}
      >
        <Text>Box</Text>
      </PageLayout>,
    );
    expect(baseElement).toBeTruthy();
  });
});
