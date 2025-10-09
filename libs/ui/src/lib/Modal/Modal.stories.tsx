import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Box } from "../Box/Box";
import { Button } from "../Button/Button";
import { Text } from "../Text/Text";
import { Modal } from "./Modal";

const meta: Meta<typeof Modal> = {
  component: Modal,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

export const Interactive: StoryObj<typeof Modal> = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-8">
        <Button
          onClick={() => setIsOpen(true)}
          text="Open Modal"
          variant="primary"
        />

        {isOpen && (
          <Modal onClose={() => setIsOpen(false)}>
            <Box className="w-full max-w-sm">
              <Text.Heading className="mb-4">Modal Title</Text.Heading>
              <Text.Body2 className="mb-6">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </Text.Body2>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsOpen(false)}
                  text="Close"
                  variant="primary"
                />
                <Button
                  onClick={() => setIsOpen(false)}
                  text="Cancel"
                  variant="secondary"
                />
              </div>
            </Box>
          </Modal>
        )}
      </div>
    );
  },
};

export const Default: StoryObj<typeof Modal> = {
  args: {
    children: (
      <Box className="w-full max-w-sm">
        <Text.Heading className="mb-4">Modal Title</Text.Heading>
        <Text.Body2 className="mb-6">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </Text.Body2>
        <Button text="Close" variant="primary" />
      </Box>
    ),
    onClose: () => {},
  },
  parameters: {
    layout: "fullscreen",
  },
};
