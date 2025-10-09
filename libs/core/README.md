# @dex-web/core

Core business logic and shared functionality for the DEX Web application.

## Overview

This library provides essential hooks, utilities, constants, and data models used throughout the application. It serves as the foundation for transaction handling, wallet integration, and state management.

## Contents

- **Constants**: Transaction statuses, toast messages, and application-wide constants
- **Hooks**: React hooks for token accounts, transaction signing, and wallet operations
- **Models**: TypeScript types and interfaces for core domain objects
- **Schema**: Data validation and type definitions
- **Utils**: Shared utility functions for common operations

## Key Exports

```typescript
// Transaction status
import { SwapTxStatus } from "@dex-web/core";

// Toast messages
import { BUTTON_MESSAGES, ERROR_MESSAGES, SUCCESS_MESSAGES, TRANSACTION_DESCRIPTIONS, TRANSACTION_STEPS } from "@dex-web/core";

// Hooks
import { useTokenAccounts, useTransactionSigning, useWallet } from "@dex-web/core";
```

## Development

```bash
# Build the library
pnpm nx build core

# Run tests
pnpm nx test core

# Lint
pnpm nx lint core
```

## Testing

Run tests with Vitest:

```bash
pnpm nx test core
```

## Contributing

When adding new functionality:

1. Place code in the appropriate directory (`hooks/`, `utils/`, `constants/`, etc.)
2. Export public APIs through `src/index.ts`
3. Write comprehensive tests
4. Follow existing naming conventions and code style
