import type { StorybookConfig } from "@storybook/react-vite";

import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../src/lib/**/*.@(mdx|stories.@(js|jsx|ts|tsx))"],
  addons: ["@storybook/addon-docs", "@storybook/addon-essentials"],
  staticDirs: ["../public"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  viteFinal: async (config) =>
    mergeConfig(config, {
      plugins: [nxViteTsPaths()],
    }),
};

export default config;

// To customize your Vite configuration you can use the viteFinal field.
// Check https://storybook.js.org/docs/react/builders/vite#configuration
// and https://nx.dev/recipes/storybook/custom-builder-configs
