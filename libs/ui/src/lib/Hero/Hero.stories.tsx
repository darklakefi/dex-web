import type { Meta, StoryObj } from "@storybook/react-vite";
import { Text } from "../Text/Text";
import { Hero } from "./Hero";

const meta = {
  component: Hero,
  title: "Hero",
} satisfies Meta<typeof Hero>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  args: {
    children: (
      <div>
        <Text.Heading>swap</Text.Heading>
        <Text.Body2>
          ANTI-SANDWICH DEFENSE: Value preservation system active.
        </Text.Body2>
      </div>
    ),
    image: "/images/waddles/pose4.png",
    imagePosition: "end",
  },
} satisfies Story;

export const WithImageOnStart = {
  args: {
    ...Default.args,
    imagePosition: "start",
  },
} satisfies Story;
