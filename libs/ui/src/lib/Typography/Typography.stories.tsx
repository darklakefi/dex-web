import type { Meta, StoryObj } from "@storybook/react-vite";
import Typography from "./index";

const meta: Meta<typeof Typography> = {
  component: Typography,
  title: "Typography",
};
export default meta;
type Story = StoryObj<typeof Typography>;

export const Heading: Story = {
  args: {
    children: "Heading",
    variant: "heading",
  },
};

export const Heading1: Story = {
  args: {
    children: "Heading1",
    variant: "heading1",
  },
};

export const Body: Story = {
  args: {
    children: "Body",
    variant: "body",
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

export const Link: Story = {
  args: {
    children: "Link",
    variant: "link",
  },
};
