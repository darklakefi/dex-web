import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "@storybook/test";
import { Box } from "./Box";

const meta = {
  component: Box,
  title: "Box",
} satisfies Meta<typeof Box>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  args: {
    background: "base",
    children: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    padding: "md",
    shadow: "sm",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(
      canvas.getByText(
        /Lorem ipsum dolor sit amet, consectetur adipiscing elit./gi,
      ),
    ).toBeTruthy();
  },
} satisfies Story;

export const Highlight = {
  args: {
    background: "highlight",
    children: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    padding: "md",
    shadow: "xl",
  },
} satisfies Story;
