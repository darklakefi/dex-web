# Gemini Project Context: DEX Front-end Web

This document provides context for the DEX Front-end Web project, a monorepo built with Nx, Next.js, and pnpm.

## Project Overview

This is the front-end web platform for DEX, a decentralized exchange. It's a monorepo managed with Nx, containing the main web application, end-to-end tests, and several shared libraries.

**Key Technologies:**

*   **Framework:** Next.js 15
*   **Build Tool:** Vite
*   **Package Manager:** pnpm
*   **Monorepo Management:** Nx
*   **UI:** React 19, Tailwind CSS, Storybook
*   **Testing:** Playwright for E2E tests, Vitest for unit tests
*   **Linting & Formatting:** Biome
*   **Database:** PostgreSQL with Drizzle ORM
*   **API:** gRPC with Protocol Buffers

**Architecture:**

The project is structured as a monorepo with the following key directories:

*   `apps/web`: The main Next.js application.
*   `apps/web-e2e`: Playwright end-to-end tests for the web app.
*   `libs/`: Shared libraries, including:
    *   `core`: Core business logic and utilities.
    *   `ui`: Reusable UI components with Storybook.
    *   `db`: Drizzle ORM schema and migrations.
    *   `grpc-client`: gRPC client for communicating with the backend.
    *   `proto-definitions`: Protocol Buffer definitions.

## Building and Running

**Prerequisites:**

*   Node.js (>= 24.0.0)
*   pnpm (10.12.4)
*   Docker (for database)

**Quick Start:**

1.  **Clone and install dependencies:**
    ```sh
    git clone https://github.com/darklakefi/dex-web.git
    cd dex-web
    pnpm install
    npx playwright install
    ```

2.  **Set up the database:**
    *   Create a `.env` file in the project root (see `.env.example`).
    *   Start the PostgreSQL container:
        ```sh
        docker-compose up -d postgres
        ```
    *   Run database migrations:
        ```sh
        pnpm db:migrate
        ```

3.  **Start the development server:**
    ```sh
    pnpm start
    ```
    The application will be available at `http://localhost:3000`.

**Common Commands:**

| Task                 | Command                | Description                               |
| -------------------- | ---------------------- | ----------------------------------------- |
| Start dev server     | `pnpm start`           | Start the Next.js development server.     |
| Build application    | `pnpm build`           | Build the web application for production. |
| Run unit tests       | `pnpm test`            | Run Vitest unit tests for the web app.    |
| Run E2E tests        | `pnpm e2e`             | Run Playwright end-to-end tests.          |
| Lint and format      | `pnpm lint` / `pnpm format` | Run Biome to lint and format the codebase. |
| Storybook            | `npx nx storybook ui`  | Run Storybook for the UI library.         |
| View dependency graph| `pnpm dep-graph`       | Visualize project dependencies with Nx.   |

## Development Conventions

*   **Commits:** Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. All commits must be signed.
*   **Code Style:** Enforced by Biome. Use `pnpm format` to format your code.
*   **Branching:** Create a new branch for each feature or bug fix.
*   **Pull Requests:** Open a pull request on GitHub for code review. All checks must pass before merging.
*   **Database:** Use Drizzle ORM for all database operations. Migrations are generated with `drizzle-kit`.
*   **State Management:** The project uses XState for managing complex component state.
*   **gRPC:** When backend API changes, regenerate the TypeScript types for the gRPC client by running `npx nx run proto-definitions:generate`.
