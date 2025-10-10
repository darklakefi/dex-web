# DEX Front-end Web Development Guide

> **Project:** Nx monorepo for the DEX Front-end Web platform, using Next.js, Vite, Biome, and pnpm. Includes the web app and shared libraries.

> For a quick overview and common commands, see [README.md](./README.md).

## Table of Contents

- [Overview](#overview)
- [Architectural Principles](#architectural-principles)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
- [Conventional Commits](#conventional-commits)
- [Signed Commits](#signed-commits)
- [Common Nx Commands](#common-nx-commands)
- [CircleCI](#circleci)
- [Knip](#knip)
- [Recommended Extensions](#recommended-extensions)
- [Troubleshooting](#troubleshooting)
- [Further Reading](#further-reading)
- [Contact & Support](#contact--support)

## Overview

This repository is managed as an [Nx](https://nx.dev/) monorepo. It contains the entire frontend platform for the DEX, including the main Next.js application and shared libraries.

The architecture is built on a strong separation of concerns, featuring:

- **A Hybrid API Layer:** Using oRPC for application data and gRPC for high-performance blockchain operations.
- **Layered State Management:** A clear hierarchy using TanStack Query for server state, TanStack Form for forms, and XState for complex workflows.
- **Library-First Structure:** Code is organized into modular, reusable libraries with stable APIs.

## Architectural Principles

To contribute effectively, you must understand and respect these core principles.

### 1. API: Use the Right Tool for the Job

- **oRPC (Application Data):** Use the oRPC client via TanStack Query hooks for fetching data like token lists, pool info, etc. It's optimized for batching and caching.
- **gRPC (Blockchain Actions):** Use the gRPC client for executing transactions, trades, or liquidity operations. It's built for high-performance, critical actions.

### 2. State Management: A Clear Hierarchy

- **TanStack Query:** Manages **all** server state. Never use `useState`/`useEffect` for data fetching.
- **TanStack Form:** Manages **all** form state and validation.
- **XState:** Reserved **exclusively** for complex, multi-step user flows that can be modeled as a state machine (e.g., a transaction lifecycle).

### 3. Monorepo: Think in Libraries

- All shared logic, UI components, and utilities **must** reside in a `libs/` library.
- The `apps/web` project should primarily compose features from these libraries.
- Respect library boundaries by only importing from a library's public API (`index.ts`).

## Prerequisites

Before you begin, make sure you have the following installed **on your local machine**:

- **Node.js:** `v24.0.0` or higher (use `nvm` or `asdf`).
- **pnpm:** `v10.12.4`.
- **Git**

## Quick Start 🚀

1.  **Clone and install dependencies:**
    ```sh
    git clone [https://github.com/darklakefi/dex-web.git](https://github.com/darklakefi/dex-web.git)
    cd dex-web
    pnpm install
    ```
2.  **Start the development server:**
    ```sh
    pnpm start
    ```
    The application will be running at [http://localhost:3000](http://localhost:3000).

## Development Workflow

- **Start dev server:** `pnpm start`
- **Build the app:** `pnpm build`
- **Run tests:** `pnpm test`
- **Format code:** `pnpm format`
- **View dependency graph:** `pnpm dep-graph`

## Conventional Commits

We use the Conventional Commits specification. This is enforced by our CI.

## Signed Commits

All commits to this repository must be signed. Unsigned commits will be rejected by CI. Please follow the instructions in the DEVELOPMENT.md to set up GPG key signing.

## Common Nx Commands

| Script            | Description                        |
| ----------------- | ---------------------------------- |
| `pnpm start`      | Start the dev server               |
| `pnpm build`      | Build the web app                  |
| `pnpm test`       | Run tests                          |
| `pnpm lint`       | Lint the codebase                  |
| `pnpm format`     | Format the codebase                |
| `pnpm dep-graph`  | Visualize project dependencies     |

## CircleCI

See CIRCLECI.md for full details on our CI/CD pipeline.

## Knip: Unused Code & Dependency Checker

Knip helps keep the repository clean by finding unused files, exports, and dependencies.

```bash
pnpm knip
```

Run this before submitting a PR to help keep the codebase tidy.

## Recommended Extensions

_This section would typically include IDE extensions and tools that are recommended for development._

## Troubleshooting

_This section would typically include common issues and their solutions._

## Further Reading

_This section would typically include links to additional documentation and resources._

## Contact & Support

_This section would typically include information on how to get help or contact the team._
