import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "@storybook/test";
import { useState } from "react";
import { NumericInput } from "./NumericInput";

const meta = {
  component: NumericInput,
  title: "NumericInput",
} satisfies Meta<typeof NumericInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {
  args: {
    label: "First Name",
    name: "firstName",
    value: "John",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    expect(input).toHaveValue("John");
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <NumericInput
        {...args}
        onChange={(e) => setValue(e.target.value)}
        value={value}
      />
    );
  },
} satisfies Story;
