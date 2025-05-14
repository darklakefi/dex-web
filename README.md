# DEX Front-end Web

[![Nx Cloud](https://img.shields.io/badge/Nx%20Cloud-enabled-brightgreen?logo=nx&logoColor=white)](https://nx.app/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Node Version](https://img.shields.io/badge/node-%3E=24.0.0-brightgreen)](https://nodejs.org/) [![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black?logo=next.js)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react)](https://react.dev/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.6-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/) [![pnpm](https://img.shields.io/badge/pnpm-10.11.0-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/) [![Playwright](https://img.shields.io/badge/Playwright-1.52.0-45ba63?logo=playwright&logoColor=white)](https://playwright.dev/) [![Vitest](https://img.shields.io/badge/Vitest-3.1.3-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)

## Run tasks

To run the dev server for the DEX web app, use:

```sh
npx nx dev web
```

To create a production bundle:

```sh
npx nx build web
```

To run the unit tests:

```sh
npx nx test web
```

To run the end-to-end tests:

```sh
npx nx e2e web-e2e
```

To run the linter:

```sh
npx nx biome-lint web
```

To see all available targets to run for a project, run:

```sh
npx nx show project web
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/next:app demo
```

To generate a new library, use:

```sh
npx nx g @nx/react:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
