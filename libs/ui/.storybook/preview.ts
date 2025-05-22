import type { Preview } from "@storybook/react-vite";
import { themes } from "@storybook/theming";
import "./global.css";

const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    docs: {
      toc: true,
      theme: themes.dark,
    },
  },
};

export default preview;
