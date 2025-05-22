import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "@storybook/test";
import Box from "./Box";
const meta = {
  component: Box,
  title: "Box",
} satisfies Meta<typeof Box>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  args: {
    children: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    background: "base",
    padding: "md",
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
    children: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    background: "highlight",
    padding: "md",
  },
} satisfies Story;
