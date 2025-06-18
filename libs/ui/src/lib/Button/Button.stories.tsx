import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  component: Button,
  title: "Button",
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    text: "Primary",
    variant: "primary",
  },
};

export const PrimaryDisabled: Story = {
  args: {
    disabled: true,
    text: "Primary",
    variant: "primary",
  },
};

export const PrimaryDark: Story = {
  args: {
    text: "Primary Dark",
    variant: "primary-dark",
  },
};

export const PrimaryDarkDisabled: Story = {
  args: {
    disabled: true,
    text: "Primary Dark",
    variant: "primary-dark",
  },
};

export const Secondary: Story = {
  args: {
    text: "Secondary",
    variant: "secondary",
  },
};

export const SecondaryDisabled: Story = {
  args: {
    disabled: true,
    text: "Secondary",
    variant: "secondary",
  },
};

export const Tertiary: Story = {
  args: {
    text: "Tertiary",
    variant: "tertiary",
  },
};

export const TertiaryDisabled: Story = {
  args: {
    disabled: true,
    text: "Tertiary",
    variant: "tertiary",
  },
};

export const LeadingIcon: Story = {
  args: {
    leadingIcon: "play",
    text: "Primary",
    variant: "primary",
  },
};

export const TrailingIcon: Story = {
  args: {
    text: "Primary",
    trailingIcon: "play",
    variant: "primary",
  },
};

export const LeadingAndTrailingIcon: Story = {
  args: {
    leadingIcon: "play",
    text: "Primary",
    trailingIcon: "trending",
    variant: "primary",
  },
};

export const IconOnly: Story = {
  args: {
    icon: "play",
    variant: "primary",
  },
};

export const PrimaryLoading: Story = {
  args: {
    loading: true,
    text: "Primary",
    variant: "primary",
  },
};
