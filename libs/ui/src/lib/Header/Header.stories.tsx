import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button/Button";
import { Icon } from "../Icon/Icon";
import { Text } from "../Text/Text";
import { Header } from "./Header";

const meta = {
  component: Header,
  title: "Header",
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  args: {
    button: <Button variant="primary">CONNECT WALLET</Button>,
    children: (
      <>
        <Text.Link className="inline-flex items-baseline justify-center leading-none no-underline">
          Home
        </Text.Link>
        <Text.Link className="inline-flex items-baseline justify-center leading-none no-underline">
          About
        </Text.Link>
        <Text.Link className="inline-flex items-baseline justify-center gap-2 leading-none no-underline">
          Contact <Icon className="size-4" name="external-link" />
        </Text.Link>
      </>
    ),
    logoLg: <Icon className="h-6 w-auto stroke-none" name="logo-lg" />,
    logoSm: <Icon className="h-6 w-auto stroke-none" name="logo-sm" />,
  },
} satisfies Story;
