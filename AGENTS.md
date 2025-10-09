# Repository Guidelines

## Project Structure & Module Organization
- `apps/web` is the Next.js App Router entry; features are grouped under `apps/web/src/app`.
- Shared libraries are in `libs/` (`core`, `db`, `orpc`, `grpc-client`, `ui`, `utils`) and must expose a minimal API from `src/index.ts`.
- Playwright suites are in `apps/web-e2e/e2e`. Public assets are in `apps/web/public`.
- Generated outputs (`dist/`, `.next/`, `coverage/`, `storybook-static/`) are disposable and excluded from version control.

## Build, Test, and Development Commands
- `pnpm start`: Starts the Next.js dev server.
- `pnpm build`: Creates a production bundle in `dist/apps/web`.
- `pnpm test`: Runs Vitest unit tests. Append `--watch` for interactive mode.
- `pnpm e2e`: Runs Playwright E2E tests (install browsers via `npx playwright install`).
- `pnpm format`: Formats code using Biome.
- Database commands: `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio`.
- Monorepo commands: `pnpm dep-graph`, `pnpm build-storybook`.

## Coding Style & Naming Conventions
- Biome enforces code style (2-space indent, LF endings, double quotes). Lefthook triggers formatting on pre-commit.
- Naming: `PascalCase` for components, `useCamelCase` for hooks, `camelCase` for utilities.
- Module Boundaries: All public exports must go through a library's `index.ts`.
- API Communication: All backend communication must use the typed, generated oRPC and gRPC clients. Direct `fetch` calls are disallowed.

## Testing Guidelines
- Unit/integration tests use Vitest with `happy-dom`. Co-locate specs in `__tests__` directories with a `*.test.ts(x)` suffix.
- Generate test coverage with `pnpm test -- --coverage`.
- E2E tests are in `apps/web-e2e/e2e/*.spec.ts`. Run with `pnpm e2e -- --headed` during development.

## Commit & Pull Request Guidelines
- Commits must follow Conventional Commits and be GPG/SSH signed.
- Before pushing, run `pnpm format`, `pnpm test`, and relevant E2E tests.
- PR descriptions must detail scope, reference tickets, and include visual proof (screenshots, Storybook links) for UI changes.
- Wait for all CircleCI and Nx Cloud checks to pass before requesting a review.

## Tooling & Automation
- Use `pnpm affected:<task>` to run commands only on projects affected by your changes.
- Regenerate RPC clients with `pnpm nx run proto-definitions:generate` after modifying any `.proto` file in `libs/proto-definitions/proto`.
- Drizzle migration files are generated in `libs/db`. Document any required migration order in PRs.
- Environment variables are loaded from `.env` files. Never commit credentials.
