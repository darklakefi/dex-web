# DEX Front-end Web

[![CircleCI](https://dl.circleci.com/status-badge/img/circleci/BhAWy2CHXMgyv94JR5daWa/5tuv61EfZ6SSqJrmAsiPbJ/tree/develop.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/circleci/BhAWy2CHXMgyv94JR5daWa/5tuv61EfZ6SSqJrmAsiPbJ/tree/develop) [![Nx Cloud](https://img.shields.io/badge/Nx%20Cloud-enabled-brightgreen?logo=nx&logoColor=white)](https://nx.app/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Node Version](https://img.shields.io/badge/node-%3E=22.0.0-brightgreen)](https://nodejs.org/) [![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?logo=next.js)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-19.1.0-61DAFB?logo=react)](https://react.dev/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.8-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/) [![pnpm](https://img.shields.io/badge/pnpm-10.11.1-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/) [![Playwright](https://img.shields.io/badge/Playwright-1.52.0-45ba63?logo=playwright&logoColor=white)](https://playwright.dev/) [![Vitest](https://img.shields.io/badge/Vitest-3.2.1-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev/) [![Storybook](https://img.shields.io/badge/Storybook-9.0.4-FF4785?logo=storybook&logoColor=white)](https://storybook.js.org/) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE) [![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)

## Overview

This is the front-end web platform for DEX, built as an Nx monorepo using Next.js, Vite, Playwright, Biome, and pnpm. It includes all frontend apps, E2E tests, and shared libraries.

For detailed setup instructions, prerequisites, and development guidelines, see [DEVELOPMENT.md](./DEVELOPMENT.md).

## Quick Start

```sh
# Clone and install
git clone https://github.com/darklakefi/dex-web.git
cd dex-web
pnpm install
npx playwright install

# Start development
pnpm start
```

## Common Commands

| Task       | Command               | Description                       |
| ---------- | --------------------- | --------------------------------- |
| Dev server | `pnpm start`          | Start the development server      |
| Build      | `pnpm build`          | Build the web application         |
| Test Web   | `pnpm test`           | Run web application tests         |
| Lint       | `pnpm lint`           | Lint the web application          |
| E2E        | `pnpm e2e`            | Run end-to-end tests              |
| Storybook  | `pnpm build-storybook`| Build Storybook for UI components |
| Dep Graph  | `pnpm dep-graph`      | Visualize project dependencies    |
| Format     | `pnpm format`         | Format codebase                   |
| Update Nx  | `pnpm update`         | Update Nx to latest version       |

> You can still use `npx nx ...` for any Nx command, but these scripts provide convenient shortcuts.

## Project Structure

This is an Nx monorepo that enables:

- Project Graphs for dependency visualization
- Task Orchestration (build, test, lint, e2e)
- Code Generation via Nx plugins
- Affected Commands for efficient CI/local workflows

## Learn More

- [Nx documentation](https://nx.dev/getting-started/intro)
- [Next.js documentation](https://nextjs.org/docs)
- [Vite documentation](https://vite.dev/guide/)
- [Playwright documentation](https://playwright.dev/docs/intro)
- [Biome documentation](https://biomejs.dev/docs/)
