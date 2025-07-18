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
  parameters: {
    a11y: {
      test: "todo",
    },
    docs: {
      theme: darklakeTheme,
      toc: true,
    },

    initialGlobals: {
      viewport: { isRotated: false, value: "ipad" },
    },

    viewport: {
      options: INITIAL_VIEWPORTS,
    },
  },
  tags: ["autodocs"],
};

export const loaders = isChromatic() && document.fonts ? [fontLoader] : [];
export default preview;
