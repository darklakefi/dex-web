import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "@storybook/test";
import { Toast } from "./Toast";

const meta = {
  component: Toast,
  title: "Toast",
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success = {
  args: {
    actions: [
      {
        label: "Action",
        onClick: () => {},
      },
    ],
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    onClose: () => {},
    title: "Success",
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

export const ErrorToast = {
  args: {
    actions: [
      {
        label: "Action",
        onClick: () => {},
      },
    ],
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    onClose: () => {},
    title: "Error",
    variant: "error",
  },
} satisfies Story;

export const Warning = {
  args: {
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    onClose: () => {},
    title: "Warning",
    variant: "warning",
  },
} satisfies Story;

export const Info = {
  args: {
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    onClose: () => {},
    title: "Info",
    variant: "info",
  },
} satisfies Story;

export const Loading = {
  args: {
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    onClose: () => {},
    title: "Loading",
    variant: "loading",
  },
} satisfies Story;
