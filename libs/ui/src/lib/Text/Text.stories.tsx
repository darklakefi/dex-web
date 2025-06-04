import type { Meta, StoryObj } from "@storybook/react-vite";
import Text from "./Text";

const meta: Meta<typeof Text> = {
  component: Text,
  title: "Text",
};
export default meta;
type Story = StoryObj<typeof Text>;

export const Heading: Story = {
  args: {
    children: "Heading",
    variant: "heading",
  },
};

export const Body1: Story = {
  args: {
    children: "Body1",
    variant: "body1",
  },
};

export const Body2: Story = {
  args: {
    children: "Body2",
    variant: "body2",
  },
};

export const Body2Lowercase: Story = {
  args: {
    children: "Body2",
    variant: "body2",
    textCase: "lowercase",
  },
};

export const Link: Story = {
  args: {
    children: "Link",
    variant: "link",
  },
};
