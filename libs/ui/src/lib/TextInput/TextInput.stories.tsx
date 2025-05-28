import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "@storybook/test";
import { useState } from "react";
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
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <TextInput
        {...args}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    expect(input).toHaveValue("John");
  },
} satisfies Story;
