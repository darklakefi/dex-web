# @dex-web/db

Database layer using Drizzle ORM for the DEX Web application.

## Overview

This library provides database schemas, migrations, and data access utilities. It uses Drizzle ORM with PostgreSQL for type-safe database operations.

## Contents

- **Schemas**: Drizzle schema definitions for all database tables
- **Migrations**: SQL migration files in `drizzle/` directory
- **Mocks**: Test data and mock utilities for testing
- **Seed**: Database seeding utilities for development

## Key Exports

```typescript
import { tokens } from '@dex-web/db';
```

## Development

```bash
# Build the library
pnpm nx build db

# Run tests
pnpm nx test db

# Lint
pnpm nx lint db
```

## Database Commands

```bash
# Generate migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Open Drizzle Studio
pnpm db:studio
```

## Migrations

Migrations are stored in the `drizzle/` directory and should be run in order. See `DEVELOPMENT.md` for more information on managing database migrations.

## Testing

All database operations should be tested using the provided mock utilities:

```bash
pnpm nx test db
```

## Contributing

When adding new tables or modifying schemas:

1. Create schema definition in `src/schemas/`
2. Generate migration with `pnpm db:migrate`
3. Update seed data if needed
4. Export schema from `src/index.ts`
5. Test thoroughly with mock data
