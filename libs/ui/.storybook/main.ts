import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/lib/**/*.@(mdx|stories.@(js|jsx|ts|tsx))"],
  managerHead: () => `
    <link rel="preload" href="bitsumishi-regular.woff2" as="font" type="font/woff2" />
    <link rel="preload" href="classic-console-neue.woff2" as="font" type="font/woff2" />
  `,
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-essentials",
    "@storybook/addon-themes",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  staticDirs: ["../public"],
  framework: "@storybook/react-vite",
  core: {
    builder: {
      name: "@storybook/builder-vite",
      options: { viteConfigPath: "vite.config.ts" },
    },
  },
};

export default config;

// To customize your Vite configuration you can use the viteFinal field.
// Check https://storybook.js.org/docs/react/builders/vite#configuration
// and https://nx.dev/recipes/storybook/custom-builder-configs
