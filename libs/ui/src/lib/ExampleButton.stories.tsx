import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "@storybook/test";
import { ExampleButton } from "./ExampleButton";

const meta: Meta<typeof ExampleButton> = {
	component: ExampleButton,
	title: "ExampleButton",
};
export default meta;
type Story = StoryObj<typeof ExampleButton>;

export const Primary: Story = {
	args: {
		children: "Click me",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByText(/Click me/gi)).toBeTruthy();
		expect(canvas.getByText(/Click me/gi).className).toContain("bg-blue-500");
	},
};

export const Secondary: Story = {
	args: {
		children: "Click me",
		variant: "secondary",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByText(/Click me/gi)).toBeTruthy();
		expect(canvas.getByText(/Click me/gi).className).toContain("bg-red-500");
	},
};
