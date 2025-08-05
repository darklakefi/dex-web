import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";
import { Tooltip } from "./Tooltip";

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
  title: "Tooltip",
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Basic: Story = {
  render: () => (
    <div>
      <Button data-tooltip-id="my-tooltip">Hover me</Button>
      <Tooltip id="my-tooltip">
        <Text.Body2 className="text-green-300">This is a tooltip</Text.Body2>
      </Tooltip>
    </div>
  ),
};

export const LongContent: Story = {
  render: () => (
    <div>
      <Button data-tooltip-id="long-tooltip">Hover for more info</Button>
      <Tooltip id="long-tooltip">
        <Text.Body2>
          This tooltip contains a longer explanation that might wrap to multiple
          lines.
        </Text.Body2>
      </Tooltip>
    </div>
  ),
};

export const WithHtmlContent: Story = {
  render: () => (
    <div>
      <Button data-tooltip-id="html-tooltip">Hover for formatted info</Button>
      <Tooltip id="html-tooltip">
        <div>
          <strong>Important:</strong>
          <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
            <li>First item</li>
            <li>Second item</li>
          </ul>
        </div>
      </Tooltip>
    </div>
  ),
};
