# DEX Front-end Web Development Guide

> **Project:** Nx monorepo for the DEX Front-end Web platform, using Next.js, Vite, Playwright, Biome, and pnpm. Includes all frontend apps, E2E tests, and shared libraries.

> For a quick overview and common commands, see [README.md](./README.md).

## Table of Contents

- [Overview](#overview)
- [Architectural Principles](#architectural-principles)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Database Setup](#database-setup)
- [Development Workflow](#development-workflow)
- [Conventional Commits](#conventional-commits)
- [Signed Commits](#signed-commits)
- [Common Nx Commands](#common-nx-commands)
- [Storybook](#storybook)
- [CircleCI](#circleci)
- [Knip](#knip)
- [Recommended Extensions](#recommended-extensions)
- [Troubleshooting](#troubleshooting)
- [Further Reading](#further-reading)
- [Contact & Support](#contact--support)

## Overview

This repository is managed as an [Nx](https://nx.dev/) monorepo. It contains the entire frontend platform for the DEX, including the main Next.js application, shared libraries, and E2E tests.

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

- **Node.js:** `v22.0.0` or higher (use `nvm` or `asdf`).
- **pnpm:** `v10.17.0` or higher.
- **Git**
- **Docker Desktop** (for the database).

## Quick Start 🚀

1.  **Clone and install dependencies:**
    ```sh
    git clone [https://github.com/darklakefi/dex-web.git](https://github.com/darklakefi/dex-web.git)
    cd dex-web
    pnpm install
    ```
2.  **Install Playwright browsers:**
    ```sh
    npx playwright install
    ```
3.  **Set up the database** (see [Database Setup](#database-setup) below).
4.  **Start the development server:**
    ```sh
    pnpm start
    ```
    The application will be running at [http://localhost:3000](http://localhost:3000).

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

### 1. Start PostgreSQL Server

```sh
docker-compose up -d postgres
```

### 2. Environment Configuration

Create a `.env` file in the project root with your database connection string:

```bash
# .env
POSTGRES_HOSTNAME="localhost"
POSTGRES_DB="postgres"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="password"
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOSTNAME}:5432/${POSTGRES_DB}?schema=public"
```

### 3. Database Schema & Migrations

The database schema is defined in `libs/db/src/schema.ts`. For local development, you can push schema changes directly.

Run database migrations:

```bash
pnpm db:migrate
```

This command uses drizzle-kit push to synchronize your database with the schema.

Generate migration files (for production):

```bash
pnpm nx run db:generate
```

### 4. Seeding the Database

Populate your database with sample data using the seed script.

```bash
pnpm db:seed
```

The seeding logic is defined in `libs/db/src/seed.ts`.

### 5. Open Drizzle Studio

To browse and edit your database, open Drizzle Studio:

```bash
pnpm db:studio
```

This opens a web interface at http://localhost:4983.

### 6. Reset the database (removes all data):

```bash
docker-compose down --volumes
docker-compose up -d postgres
pnpm db:migrate
```

## Development Workflow

- **Start dev server:** `pnpm start`
- **Build the app:** `pnpm build`
- **Run tests:** `pnpm test`
- **Run E2E tests:** `pnpm e2e`
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
| `pnpm lint:fix`   | Fix only linting issues            |
| `pnpm e2e`        | Run E2E tests                      |
| `pnpm format`     | Format the codebase                |
| `pnpm format:check` | Check if code is formatted          |
| `pnpm fix`        | Fix all auto-fixable issues (lint + format) |
| `pnpm dep-graph`  | Visualize project dependencies     |
| `pnpm db:migrate` | Apply database schema changes      |
| `pnpm db:seed`    | Seed the database with sample data |
| `pnpm db:studio`  | Open the Drizzle Studio web UI     |

## Storybook

Storybook is used for developing UI components in isolation.

```bash
pnpm nx storybook ui
```

## CircleCI

See CIRCLECI.md for full details on our CI/CD pipeline.

## Knip: Unused Code & Dependency Checker

Knip helps keep the repository clean by finding unused files, exports, and dependencies.

```bash
pnpm knip
```

Run this before submitting a PR to help keep the codebase tidy.

## Comment Removal with Uncomment

The project includes `uncomment-cli`, a tree-sitter-based tool for removing comments from code. This is particularly useful for cleaning up AI-generated code or refactoring modules.

### When to Use

- **After AI code generation:** Clean up excessive comments from AI assistants
- **During refactoring:** Remove outdated or redundant comments
- **Manual cleanup:** Targeted removal in specific files or directories

### Configuration

The project has a `.uncommentrc.toml` configuration that:

- Preserves TODO, FIXME, and documentation comments by default
- Keeps all linting directives (ESLint, Biome, TypeScript, etc.)
- Protects test files, configs, and type definitions
- Respects `.gitignore` rules

### Usage Examples

```bash
# Show usage information
pnpm uncomment

# Preview changes before applying (recommended first step)
pnpm uncomment --dry-run apps/web/src/app/[lang]/swap/

# Remove comments from a specific directory
pnpm uncomment apps/web/src/app/_components/

# Remove including TODOs (use carefully)
pnpm uncomment --remove-todo apps/web/src/utils/

# Process with verbose output to see what's happening
pnpm uncomment --verbose apps/web/src/hooks/

# Override thread count (8 threads instead of auto-detect)
pnpm uncomment --threads 8 apps/web/src/components/

# Disable parallel processing (single-threaded)
pnpm uncomment --threads 1 apps/web/src/components/
```

### Best Practices

- **Always use `--dry-run` first** to preview changes
- Use on specific directories rather than the entire codebase
- Review changes before committing
- Don't remove comments that explain complex Solana logic or business rules

**Note:** This tool is **not** part of pre-commit hooks and should be used intentionally, not automatically.

## Recommended Extensions

_This section would typically include IDE extensions and tools that are recommended for development._

## Troubleshooting

_This section would typically include common issues and their solutions._

## Further Reading

_This section would typically include links to additional documentation and resources._

## Contact & Support

_This section would typically include information on how to get help or contact the team._
