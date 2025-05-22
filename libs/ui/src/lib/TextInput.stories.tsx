import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "@storybook/test";
import { TextInput } from "./TextInput";
const meta = {
  component: TextInput,
  title: "TextInput",
} satisfies Meta<typeof TextInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  args: {
    name: "firstName",
    label: "First Name",
    value: "John",
    onChange: () => {},
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
