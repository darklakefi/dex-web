# Gemini Project Context: DEX Front-end Web

This document provides context for the DEX Front-end Web project, a monorepo built with Nx, Next.js, and pnpm.

## Project Overview

This is the front-end web platform for DEX, a decentralized exchange. It's a monorepo managed with Nx, containing the main web application, end-to-end tests, and several shared libraries.

**Key Technologies:**

- **Framework:** Next.js 15
- **Monorepo Management:** Nx
- **UI:** React 19, Tailwind CSS, Storybook
- **Testing:** Playwright for E2E tests, Vitest for unit tests
- **Linting & Formatting:** Biome
- **Database:** PostgreSQL with Drizzle ORM
- **API:** Hybrid **oRPC** (for app data) & **gRPC** (for blockchain actions) with Protocol Buffers.
- **Package Manager:** pnpm

**Architecture:**

The project is structured as a monorepo with the following key directories:

- `apps/web`: The main Next.js application.
- `apps/web-e2e`: Playwright end-to-end tests for the web app.
- `libs/`: Shared libraries, including:
  - `core`: Core business logic, domain models, and shared hooks.
  - `ui`: Reusable UI components documented with Storybook.
  - `db`: Drizzle ORM schema, migrations, and seeding.
  - `orpc`: oRPC client, routers, and TanStack Query integration.
  - `grpc-client`: Generated gRPC client for blockchain operations.
  - `proto-definitions`: Protocol Buffer (`.proto`) definitions.

## Building and Running

**Prerequisites:**

- Node.js (>= 24.0.0)
- pnpm (10.12.4)
- Docker (for database)

**Quick Start:**

1.  **Clone and install:**
    ```sh
    git clone [https://github.com/darklakefi/dex-web.git](https://github.com/darklakefi/dex-web.git) && cd dex-web
    pnpm install && npx playwright install
    ```
2.  **Set up the database:**
    - Create a `.env` file in the project root.
    - Start the PostgreSQL container: `docker-compose up -d postgres`
    - Run migrations: `pnpm db:migrate` (this runs `drizzle-kit push` for local dev).
3.  **Start the development server:**
    ```sh
    pnpm start
    ```
    The application will be available at `http://localhost:3000`.

**Common Commands:**

| Task                  | Command                |
| --------------------- | ---------------------- |
| Start dev server      | `pnpm start`           |
| Build application     | `pnpm build`           |
| Run unit tests        | `pnpm test`            |
| Run E2E tests         | `pnpm e2e`             |
| Lint and format       | `pnpm format`          |
| Storybook             | `pnpm nx storybook ui` |
| View dependency graph | `pnpm dep-graph`       |
| DB Migrations         | `pnpm db:migrate`      |

## Development Conventions

- **Commits:** Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. All commits must be signed.
- **Code Style:** Enforced by Biome (`pnpm format`).
- **State Management:** Uses a clear hierarchy: **TanStack Query** for all server state, **TanStack Form** for all form state, and **XState** is reserved for complex multi-step workflows (e.g., transaction orchestration).
- **RPC Clients:** When backend API changes in the `.proto` files, regenerate the TypeScript clients by running `pnpm nx run proto-definitions:generate`.
