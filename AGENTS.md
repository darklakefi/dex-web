# Repository Guidelines

## Project Structure & Module Organization
- `apps/web` is the Next.js App Router entry; group features under `apps/web/src/app`.
- Shared libraries live in `libs/` (`core`, `transaction-core`, `solana-utils`, `ui`, etc.) and should expose a minimal API from `src/index.ts`.
- Playwright suites sit in `apps/web-e2e/e2e`; public assets live under `apps/web/public`.
- Generated outputs (`dist/`, `coverage/`, `storybook-static/`) are disposable and stay out of version control.

## Build, Test, and Development Commands
- `pnpm start` – Next dev server with Turbopack.
- `pnpm build` – production bundle written to `apps/web/dist`.
- `pnpm test` – Vitest + Testing Library; append `--watch` when iterating.
- `pnpm e2e` – Playwright specs (install browsers via `npx playwright install`).
- `pnpm lint` / `pnpm format` – Nx lint plus Biome formatting.
- Database utilities: `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:studio`.
- Extras: `pnpm dep-graph` for dependency maps, `pnpm build-storybook` for UI docs.

## Coding Style & Naming Conventions
Biome enforces two-space indentation, LF endings, double quotes, and sorted Tailwind classes (triggered by Lefthook). Stick to `PascalCase` for components, `useCamelCase` for hooks, and `camelCase` utilities. Colocate route code within the matching folder in `app/`, keep Tailwind tokens in `tailwind.css`, and funnel public exports through each library’s `index.ts` to preserve stable module boundaries.

## Testing Guidelines
Vitest with `happy-dom` powers unit and integration tests; colocate specs in `__tests__` directories using the `*.test.ts(x)` suffix. Generate coverage with `pnpm test -- --coverage` (outputs to `coverage/apps/web`). Extend Playwright flows in `apps/web-e2e/e2e/*.spec.ts` and run `pnpm e2e -- --headed` before you open a PR.

## Commit & Pull Request Guidelines
Commits must follow Conventional Commits (see `commitlint.config.ts`) and be GPG/SSH signed. Stage only intentional changes so Lefthook can auto-run Biome. Before pushing, run `pnpm lint`, `pnpm test`, and the relevant Playwright suites; note any coverage or migration impacts in the PR. Describe scope, reference tickets, call out env changes, and include screenshots or Storybook links for UI work. Wait for CircleCI and Nx Cloud checks before requesting review.

## Tooling & Automation
Use `pnpm affected:<task>` to limit work to touched projects. Regenerate gRPC types with `pnpm nx run proto-definitions:generate` when editing `libs/proto-definitions/proto`. Keep Drizzle migrations in `libs/db` and document run order in the PR. Secrets load from `.env*`; rely on the examples in `DEVELOPMENT.md` and never commit real credentials.
