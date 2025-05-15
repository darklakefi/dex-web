import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "@storybook/test";
import { ExampleButton } from "./ExampleButton";

const meta: Meta<typeof ExampleButton> = {
	component: ExampleButton,
	title: "ExampleButton",
};
export default meta;
type Story = StoryObj<typeof ExampleButton>;

export const Primary = {
	args: {},
};

export const Heading: Story = {
	args: {},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		expect(canvas.getByText(/Click me/gi)).toBeTruthy();
	},
};
