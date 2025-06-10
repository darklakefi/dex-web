import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-themes",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  core: {
    builder: {
      name: "@storybook/builder-vite",
      options: { viteConfigPath: "vite.config.storybook.ts" },
    },
  },
  framework: "@storybook/react-vite",
  staticDirs: ["../public"],
  stories: ["../src/lib/**/*.@(mdx|stories.@(js|jsx|ts|tsx))"],
};

export default config;

// To customize your Vite configuration you can use the viteFinal field.
// Check https://storybook.js.org/docs/react/builders/vite#configuration
// and https://nx.dev/recipes/storybook/custom-builder-configs
