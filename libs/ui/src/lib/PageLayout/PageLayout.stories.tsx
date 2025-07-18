import type { Meta, StoryObj } from "@storybook/react-vite";
import { Footer } from "../Footer/Footer";
import { Default as FooterDefault } from "../Footer/Footer.stories";
import { Header } from "../Header/Header";
import { Default as HeaderDefault } from "../Header/Header.stories";
import { Text } from "../Text/Text";
import { backgroundImage, PageLayout } from "./PageLayout";

const meta = {
  component: PageLayout,
  title: "PageLayout",
} satisfies Meta<typeof PageLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

const headerArgs = HeaderDefault.args;
const footerArgs = FooterDefault.args;

export const Default = {
  args: {
    backgroundImageUrl: backgroundImage,
    children: <Text>Hello</Text>,
    footer: <Footer {...footerArgs} />,
    header: <Header {...headerArgs} />,
  },
} satisfies Story;
