import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "./Button";

const meta: Meta<typeof Button> = {
  component: Button,
  title: "Button",
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    text: "Primary",
  },
};

export const PrimaryDisabled: Story = {
  args: {
    variant: "primary",
    disabled: true,
    text: "Primary",
  },
};

export const PrimaryDark: Story = {
  args: {
    variant: "primary-dark",
    text: "Primary Dark",
  },
};

export const PrimaryDarkDisabled: Story = {
  args: {
    variant: "primary-dark",
    disabled: true,
    text: "Primary Dark",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    text: "Secondary",
  },
};

export const SecondaryDisabled: Story = {
  args: {
    variant: "secondary",
    disabled: true,
    text: "Secondary",
  },
};

export const Tertiary: Story = {
  args: {
    variant: "tertiary",
    text: "Tertiary",
  },
};

export const TertiaryDisabled: Story = {
  args: {
    variant: "tertiary",
    disabled: true,
    text: "Tertiary",
  },
};

export const LeadingIcon: Story = {
  args: {
    variant: "primary",
    text: "Primary",
    leadingIcon: "play",
  },
};

export const TrailingIcon: Story = {
  args: {
    variant: "primary",
    text: "Primary",
    trailingIcon: "play",
  },
};

export const LeadingAndTrailingIcon: Story = {
  args: {
    variant: "primary",
    text: "Primary",
    leadingIcon: "play",
    trailingIcon: "trending",
  },
};

export const IconOnly: Story = {
  args: {
    variant: "primary",
    icon: "play",
  },
};

export const PrimaryLoading: Story = {
  args: {
    variant: "primary",
    text: "Primary",
    isLoading: true,
  },
};
