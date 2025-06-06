import type { Preview } from "@storybook/react-vite";
import isChromatic from "chromatic/isChromatic";
import { INITIAL_VIEWPORTS } from "storybook/viewport";
import { darklakeTheme } from "./darklakeTheme";
import "./global.css";

const fontLoader = async () => ({
  fonts: await Promise.all([
    document.fonts.load("400 1em Bitsumishi"),
    document.fonts.load("400 1em Classic Console Neue"),
  ]),
});

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
};

export const loaders = isChromatic() && document.fonts ? [fontLoader] : [];
export default preview;
