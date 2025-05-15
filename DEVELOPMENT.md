# DEX Front-end Web Development Guide

> **Project:** Nx monorepo for the DEX Front-end Web platform, using Next.js, Vite, Playwright, Biome, and pnpm. Includes all frontend apps, E2E tests, and shared libraries.

> For a quick overview and common commands, see [README.md](./README.md).

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
- [Conventional Commits](#conventional-commits)
- [Signed Commits](#signed-commits)
- [Common Nx Commands](#common-nx-commands)
- [Recommended Extensions](#recommended-extensions)
- [Troubleshooting](#troubleshooting)
- [Further Reading](#further-reading)
- [Contact & Support](#contact--support)

## Overview

This repository is managed as an [Nx](https://nx.dev/) monorepo, enabling:

- **Project Graphs** for dependency visualization
- **Task Orchestration** (build, test, lint, e2e)
- **Code Generation** via Nx plugins
- **Affected Commands** for efficient CI/local workflows
- **Consistent Tooling**: Next.js 15.3.2, Vite, Playwright 1.52.0, Biome, pnpm 10.11.0

## Prerequisites

Before you begin, make sure you have the following installed **on your local machine**:

### 1. Node.js (≥ 22.0.0)

- **Recommended:** Use a version manager like [nvm](https://github.com/nvm-sh/nvm) or [asdf](https://asdf-vm.com/).
- **Check version:**
  ```sh
  node -v
  ```
- **Install (macOS/Linux):**
  ```sh
  nvm install 22
  nvm use 22
  ```
- **Install (Homebrew, macOS):**
  ```sh
  brew install node@22
  ```

### 2. pnpm (10.11.0)

- **Check version:**
  ```sh
  pnpm -v
  ```
- **Install:**
  ```sh
  npm install -g pnpm@10.11.0
  ```

### 3. Git

- **Check version:**
  ```sh
  git --version
  ```
- **Install:**
  - [Git for all platforms](https://git-scm.com/downloads)

### 4. Playwright Browsers

- **Required for E2E tests.**
  ```sh
  npx playwright install
  ```

### 5. Nx CLI (Optional, for global commands)

- **You can use `npx nx ...` without installing globally.**
- **Install (optional):**
  ```sh
  npm install -g nx
  ```

### 6. Biome CLI (Optional, for local linting/formatting)

- **You can use `npx biome ...` without installing globally.**
- **Install (optional):**
  ```sh
  npm install -g @biomejs/biome
  ```

### 7. Xcode Command Line Tools (macOS only)

- **Required for building native dependencies.**
- **Install:**
  ```sh
  xcode-select --install
  ```

### 8. Git Hooks (Lefthook)

- **Auto-installed with `pnpm install`. No manual setup required.**

## Quick Start 🚀

For experienced users:

- Clone and install dependencies:
  ```sh
  git clone https://github.com/darklakefi/dex-fe-web.git
  cd dex-fe-web
  pnpm install
  npx playwright install
  npx nx dev web
  ```
- App runs at [http://localhost:3000](http://localhost:3000)

## Development Workflow

- **Run tests:**
  ```sh
  npx nx test web
  ```
- **Run linter:**
  ```sh
  npx nx biome-lint web
  ```
- **Run E2E tests:**
  ```sh
  npx nx e2e web-e2e
  ```
- **Create a new branch:**
  ```sh
  git checkout -b <feature-branch>
  ```
- **Submit a PR:**
  - Push your branch and open a pull request on GitHub.
- **Code review:**
  - Ensure all checks pass before merging.

## Conventional Commits

We use the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. This helps automate changelogs, versioning, and improves collaboration.

**Format:**

```
type(scope?): subject
```

- `type`: The kind of change (e.g., `feat`, `fix`, `docs`, `chore`, `refactor`, `test`)
- `scope` (optional): The area of the codebase affected
- `subject`: Short description of the change

**Examples:**

```
feat(web): add user profile page
fix(auth): handle token refresh error
chore: update dependencies
```

> **Tip:** Use the [Conventional Commits VSCode extension](https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits) for commit message assistance.

## Signed Commits

> **All commits to this repository must be [signed](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification). Unsigned commits will be rejected by CI and cannot be merged.**

We require that all commits are signed to verify authorship and improve security.

### Why Sign Commits?

- Ensures commits are genuinely from you
- Prevents tampering and impersonation
- Required for some repositories and CI workflows

### How to Set Up Signed Commits

1. **Generate a GPG key (if you don't have one):**

   ```sh
   gpg --full-generate-key
   ```

   - Choose `RSA and RSA` (option 1), 4096 bits, and set an expiry if desired.
   - Enter your name and email (should match your GitHub email).

2. **List your GPG keys:**

   ```sh
   gpg --list-secret-keys --keyid-format=long
   ```

3. **Copy your GPG key ID:**

   - Look for a line like `sec   rsa4096/ABCDEF1234567890` and copy the part after the slash.

4. **Tell Git to use your key:**

   ```sh
   git config --global user.signingkey ABCDEF1234567890
   git config --global commit.gpgsign true
   ```

5. **Add your GPG public key to GitHub:**
   - Export your public key:
     ```sh
     gpg --armor --export your@email.com
     ```
   - Copy the output and add it to [GitHub GPG keys](https://github.com/settings/keys).

### Troubleshooting

- If you see `gpg: signing failed: Inappropriate ioctl for device`, try:
  ```sh
  export GPG_TTY=$(tty)
  ```
- For VSCode, ensure your Git extension supports GPG signing or use the terminal.
- See [GitHub's docs](https://docs.github.com/en/authentication/managing-commit-signature-verification) for more help.

## Common Nx Commands

| Task       | Command                 |
| ---------- | ----------------------- |
| Dev server | `npx nx dev web`        |
| Build      | `npx nx build web`      |
| Test       | `npx nx test web`       |
| Lint       | `npx nx biome-lint web` |
| E2E        | `npx nx e2e web-e2e`    |

## Recommended Extensions

- [Nx Console](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console)
- [Biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
- [Playwright Test for VSCode](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
- [Conventional Commits](https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [Vitest Explorer](https://marketplace.visualstudio.com/items?itemName=vitest.explorer)
- [EditorConfig](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)

## Troubleshooting

> ⚠️ **Common Issues:**

- **Dependency install issues on macOS:**
  - Ensure Xcode Command Line Tools are installed:
    `xcode-select --install`
- **Playwright E2E requirements:**
  - See [Playwright system requirements](https://playwright.dev/docs/intro#system-requirements).
- **Biome or lint errors:**
  - Run `npx biome check .` or `npx nx biome-lint web` for details.
- **Git hooks not running:**
  - Run `pnpm install` to re-setup Lefthook.

## Further Reading

- [Nx documentation](https://nx.dev/getting-started/intro)
- [Next.js documentation](https://nextjs.org/docs)
- [Vite documentation](https://vite.dev/guide/)
- [Playwright documentation](https://playwright.dev/docs/intro)
- [Biome documentation](https://biomejs.dev/docs/)
