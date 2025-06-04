import { withThemeByDataAttribute } from "@storybook/addon-themes";
import type { Preview, ReactRenderer } from "@storybook/react-vite";
import { INITIAL_VIEWPORTS } from "storybook/viewport";
import { darklakeTheme } from "./darklakeTheme";
import "./global.css";
const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    docs: {
      toc: true,
      theme: darklakeTheme,
    },

    viewport: {
      options: INITIAL_VIEWPORTS,
    },

    initialGlobals: {
      viewport: { value: "ipad", isRotated: false },
    },

    a11y: {
      test: "todo",
    },
  },
  decorators: [
    withThemeByDataAttribute<ReactRenderer>({
      themes: {
        dark: "dark",
        light: "light",
      },
      defaultTheme: "dark",
      attributeName: "data-theme",
    }),
  ],
};

export default preview;
