# @dex-web/utils

Utility functions and helpers for the DEX Web application.

## Overview

This library provides pure, testable utility functions for common operations including amount formatting, blockchain operations, liquidity calculations, and data transformations.

## Contents

- **Blockchain**: Solana address utilities and token operations
- **Common**: Amount parsing, formatting, and unit conversion
- **Liquidity**: Pool calculations and liquidity management (see [Liquidity README](./src/liquidity/README.md))
- **Formatters**: Number and currency formatting
- **Validators**: Input validation and sanitization

## Key Features

### Amount Utilities

```typescript
import { 
  parseAmountSafe,
  formatAmount,
  toRawUnits,
  fromRawUnits,
} from '@dex-web/utils';

// Parse user input
const amount = parseAmountSafe("100.5"); // Decimal(100.5)

// Format for display
const formatted = formatAmount(amount, 2); // "100.50"

// Convert to blockchain raw units
const raw = toRawUnits(amount, 6); // 100500000n
```

### Liquidity Calculations

```typescript
import { 
  transformAddLiquidityInput,
  calculateLpTokensToReceive,
} from '@dex-web/utils';

// Transform user input to protocol payload
const payload = transformAddLiquidityInput({
  tokenAAddress: "EPjFW...",
  tokenAAmount: "100",
  tokenADecimals: 6,
  tokenBAddress: "Es9vM...",
  tokenBAmount: "200",
  tokenBDecimals: 6,
  slippage: "0.5",
  poolReserves: { /* ... */ },
  userAddress: "9WzDX...",
});
```

### Blockchain Utilities

```typescript
import { 
  sortSolanaAddresses,
  isValidSolanaAddress,
} from '@dex-web/utils';

// Sort addresses for X/Y convention
const [addressX, addressY] = sortSolanaAddresses(addressA, addressB);
```

## Development

```bash
# Build the library
pnpm nx build utils

# Run tests
pnpm nx test utils

# Lint
pnpm nx lint utils
```

## Testing

All utilities have comprehensive unit tests:

```bash
# Run all tests
pnpm nx test utils

# Run specific test file
pnpm nx test utils -- src/liquidity/__tests__/liquidityParsers.test.ts

# Run with coverage
pnpm nx test utils -- --coverage
```

## Liquidity Module

The liquidity utilities are documented in detail in [src/liquidity/README.md](./src/liquidity/README.md). This module provides pure, testable functions for:

- LP token calculations
- Slippage handling
- Pool reserve calculations
- Input validation and transformation

## Design Principles

1. **Pure Functions**: No side effects, easy to test and reason about
2. **Type Safety**: Comprehensive validation with Zod schemas
3. **Precision**: Use Decimal.js for accurate financial calculations
4. **Testability**: Small, focused functions with clear inputs/outputs
5. **Documentation**: JSDoc comments and comprehensive READMEs

## Contributing

When adding new utilities:

1. Create a new file in the appropriate category directory under `src/`
2. Write comprehensive tests with edge cases
3. Export from `src/index.ts`
4. Add JSDoc comments with examples
5. Follow existing code style and naming conventions
6. Use Decimal.js for financial calculations
7. Validate inputs with Zod schemas where appropriate
