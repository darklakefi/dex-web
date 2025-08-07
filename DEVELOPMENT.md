# DEX Front-end Web Development Guide

> **Project:** Nx monorepo for the DEX Front-end Web platform, using Next.js, Vite, Playwright, Biome, and pnpm. Includes all frontend apps, E2E tests, and shared libraries.

> For a quick overview and common commands, see [README.md](./README.md).

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Database Setup](#database-setup)
- [Development Workflow](#development-workflow)
- [Conventional Commits](#conventional-commits)
- [Signed Commits](#signed-commits)
- [Common Nx Commands](#common-nx-commands)
- [Storybook](#storybook)
- [CircleCI](#circleci)
- [Recommended Extensions](#recommended-extensions)
- [Troubleshooting](#troubleshooting)
- [Knip](#knip)
- [Further Reading](#further-reading)
- [Contact & Support](#contact--support)

## Overview

This repository is managed as an [Nx](https://nx.dev/) monorepo, enabling:

- **Project Graphs** for dependency visualization
- **Task Orchestration** (build, test, lint, e2e)
- **Code Generation** via Nx plugins
- **Affected Commands** for efficient CI/local workflows
- **Consistent Tooling**: Next.js 15.3.2, Vite, Playwright 1.52.0, Biome, pnpm 10.12.4

## Prerequisites

Before you begin, make sure you have the following installed **on your local machine**:

### 1. Node.js (≥ 24.0.0)

- **Recommended:** Use a version manager like [nvm](https://github.com/nvm-sh/nvm) or [asdf](https://asdf-vm.com/).
- **Check version:**
  ```sh
  node -v
  ```
- **Install (macOS/Linux):**
  ```sh
  nvm install 24
  nvm use 24
  ```
- **Install (Homebrew, macOS):**
  ```sh
  brew install node@24
  ```

### 2. pnpm (10.12.4)

- **Check version:**
  ```sh
  pnpm -v
  ```
- **Install:**
  ```sh
  npm install -g pnpm@10.12.4
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

### 9. Seeding the Database

After running your migrations, you can populate your database with sample data using the seed script:

```sh
pnpm db:seed
```

This will run the seeding logic defined in `libs/orpc/src/db/seed.ts` via Nx. Make sure your database schema is up to date (see migrations above) before running this command.

## Quick Start 🚀

For experienced users:

- Clone and install dependencies:
  ```sh
  git clone https://github.com/darklakefi/dex-web.git
  cd dex-web
  pnpm install
  npx playwright install
  pnpm start
  ```
- App runs at [http://localhost:3000](http://localhost:3000)

> **Tip:** You can now use `pnpm` scripts for common tasks (see below), or continue using `npx nx ...` if you prefer.

## Database Setup

This project uses PostgreSQL with Drizzle ORM for database operations. Follow these steps to set up your local database environment.

### Prerequisites

Before setting up the database, ensure you have:

- **Docker Desktop** installed and running
- **Docker Compose** (included with Docker Desktop)

### 1. Start PostgreSQL Server

The project includes a `docker-compose.yml` file that sets up a PostgreSQL container optimized for local development.

**Start the database:**
```sh
docker-compose up -d postgres
```

**Verify it's running:**
```sh
docker-compose ps
```

You should see the `dex-postgres` container running on port `5432`.

### 2. Environment Configuration

Create a `.env` file in the project root with your database connection string:

```sh
# .env
POSTGRES_HOSTNAME="localhost"
POSTGRES_DB="postgres"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="password"
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOSTNAME}:5432/${POSTGRES_DB}?schema=public"
```

> **Note:** The credentials match what's configured in `docker-compose.yml`. For production, these should be different and secure.

### 3. Database Schema & Migrations

The project uses Drizzle ORM for schema management. The database schema is defined in `libs/orpc/src/db/schema.ts`.

**Run database migrations:**
```sh
npx drizzle-kit push --config libs/db/drizzle.config.ts
```

**Generate migrations (when you change the schema):**
```sh
npx drizzle-kit generate --config libs/db/drizzle.config.ts
```

### 4. Database Management Commands

**View database schema:**
```sh
npx drizzle-kit introspect --config libs/db/drizzle.config.ts
```

**Open Drizzle Studio (database browser):**
```sh
npx drizzle-kit studio --config libs/db/drizzle.config.ts
```

This opens a web interface at [http://localhost:4983](http://localhost:4983) where you can browse and edit your database.

### 5. Connecting to PostgreSQL Directly

For debugging or advanced operations, you can connect directly to PostgreSQL:

**Using Docker:**
```sh
docker exec -it dex-postgres psql -U postgres -d postgres
```

**Using a GUI client (like TablePlus, pgAdmin):**
- Host: `localhost`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: `password`

### 6. Database Lifecycle Management

**Stop the database:**
```sh
docker-compose down
```

**Reset the database (removes all data):**
```sh
docker-compose down
docker volume rm dex-web_postgres_data
docker-compose up -d postgres
npx drizzle-kit push --config libs/orpc/drizzle.config.ts
```

**View database logs:**
```sh
docker-compose logs postgres
```

### 7. Production Considerations

The Docker setup is optimized for local development. For production:

- Use a managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
- Update the `DATABASE_URL` environment variable
- Ensure proper backup and monitoring strategies
- Use migration files instead of `push` for schema changes

### Troubleshooting

**Database connection issues:**
- Verify Docker is running: `docker info`
- Check if the container is running: `docker-compose ps`
- Ensure no other service is using port 5432: `lsof -i :5432`

**Schema/migration issues:**
- Check your schema file: `libs/orpc/src/db/schema.ts`
- Verify the `DATABASE_URL` in your `.env` file
- Try resetting the database (see step 6 above)

## CircleCI

See [CIRCLECI.md](./CIRCLECI.md) for full details on our CI/CD pipeline, local testing, and troubleshooting.

## Knip: Unused Code & Dependency Checker

[Knip](https://knip.dev/) is a tool for finding unused files, exports, and dependencies in your codebase. It helps keep the repository clean by identifying dead code and unnecessary dependencies, which can improve maintainability and reduce bundle size.

### How We Use Knip

- **Installed:** Knip is included as a dev dependency and can be run via the script in `package.json`.
- **Default Configuration:** There is no custom Knip config file in this repo; Knip uses its default settings, which work well for most monorepos and Next.js projects.

### Running Knip

To check for unused files, exports, and dependencies, run:

```sh
pnpm knip
```

Or, using npm:

```sh
npm run knip
```

Knip will scan the workspace and report any unused code or dependencies. Review the output and remove or refactor as needed.

### What Knip Checks
- Unused files (not imported anywhere)
- Unused exports (functions, components, etc. that are never used)
- Unused dependencies (declared in `package.json` but not imported)
- Unused devDependencies

### Custom Configuration
If you need to customize what Knip checks (e.g., ignore certain files or directories), you can add a `knip.json` or `knip.config.js` file at the root. See the [Knip documentation](https://knip.dev/docs/configuration) for details.

### When to Run Knip
- Before submitting a PR, to catch dead code
- Periodically, to keep the codebase clean
- When refactoring or removing features

### More Info
- [Knip documentation](https://knip.dev/docs)
- [Knip GitHub](https://github.com/webpro/knip)

## Development Workflow

- **Start dev server:**
  ```sh
  pnpm start
  ```
- **Build the app:**
  ```sh
  pnpm build
  ```
- **Run tests:**
  ```sh
  pnpm test
  ```
- **Run linter:**
  ```sh
  pnpm lint
  ```
- **Run E2E tests:**
  ```sh
  pnpm e2e
  ```
- **Format code:**
  ```sh
  pnpm format
  ```
- **View dependency graph:**
  ```sh
  pnpm dep-graph
  ```
- **Update Nx:**
  ```sh
  pnpm update
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

## Common Nx Commands (now available as pnpm scripts)

| Script                | Description                                 |
|-----------------------|---------------------------------------------|
| pnpm start            | Start the dev server (nx dev web)           |
| pnpm build            | Build the web app (nx build web)            |
| pnpm test             | Run tests (nx test web)                     |
| pnpm lint             | Lint the codebase (nx workspace-lint && nx lint) |
| pnpm e2e              | Run E2E tests (nx e2e web-e2e)              |
| pnpm dep-graph        | Visualize project dependencies              |
| pnpm format           | Format the codebase                         |
| pnpm format:check     | Check code formatting                       |
| pnpm update           | Update Nx to latest version                 |
| pnpm help             | Show Nx help                                |
| pnpm nx               | Run any Nx command                          |
| pnpm workspace-generator | Run Nx workspace generators              |

> You can still use `npx nx ...` for any Nx command, but these scripts provide convenient shortcuts.

## Storybook

Storybook is used for developing and documenting UI components in isolation. It provides a sandbox environment to build, test, and showcase components.

### Running Storybook

```sh
npx nx storybook ui
```
