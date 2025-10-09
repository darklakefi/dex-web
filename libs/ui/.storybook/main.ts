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

