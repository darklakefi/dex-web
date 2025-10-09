# Liquidity Utilities

This directory contains pure, testable utilities for liquidity pool calculations in the DEX application.

## Architecture

The liquidity module is organized into focused, single-responsibility files:

### Core Files

- **`addLiquidityTransformer.ts`** - Main entry point that orchestrates the transformation of user input into protocol payloads
- **`liquiditySchemas.ts`** - Zod validation schemas for type-safe input/output
- **`liquidityParsers.ts`** - Pure parsing functions for amounts and slippage
- **`liquidityCalculations.ts`** - Core LP token calculation algorithms
- **`decimalConfig.ts`** - Centralized Decimal.js configuration
- **`liquidityMath.ts`** - Additional liquidity math utilities
- **`calculateProportionalAmount.ts`** - Proportional amount calculations for UI

### Design Principles

1. **Pure Functions**: All functions are pure with no side effects, making them easy to test and reason about
2. **Single Responsibility**: Each module has a clear, focused purpose
3. **Type Safety**: Comprehensive Zod schemas validate all inputs and outputs
4. **Testability**: Small, focused functions with clear inputs/outputs
5. **No Console Logging**: Errors are thrown with descriptive messages instead of logging

## Usage

### Basic Usage

```typescript
import { transformAddLiquidityInput } from '@dex-web/utils';

const payload = transformAddLiquidityInput({
  tokenAAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  tokenAAmount: "100",
  tokenADecimals: 6,
  tokenBAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  tokenBAmount: "200",
  tokenBDecimals: 6,
  slippage: "0.5",
  poolReserves: {
    reserveX: 1000000000n,
    reserveY: 2000000000n,
    totalLpSupply: 1414213562n,
    protocolFeeX: 0n,
    protocolFeeY: 0n,
    userLockedX: 0n,
    userLockedY: 0n,
  },
  userAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
});
```

### Using Individual Utilities

```typescript
import { parseAmountSafe, toRawUnits, applySlippageToMax } from '@dex-web/utils';
import { Decimal } from 'decimal.js';

// Parse and validate amounts
const amount = parseAmountSafe("100.5"); // Decimal(100.5)

// Convert to raw units
const rawAmount = toRawUnits(amount, 6); // 100500000n

// Apply slippage
const slippage = new Decimal("0.5");
const maxAmount = applySlippageToMax(amount, slippage); // Decimal(101.005)
```

### LP Token Calculations

```typescript
import { calculateLpTokensToReceive } from '@dex-web/utils';

// For existing pools
const lpTokens = calculateLpTokensToReceive({
  amountX: 100000000n,
  amountY: 200000000n,
  availableReserveX: 1000000000n,
  availableReserveY: 2000000000n,
  totalLpSupply: 1414213562n,
});

// For new pools (returns sqrt(x * y))
const newPoolLpTokens = calculateLpTokensToReceive({
  amountX: 100000000n,
  amountY: 100000000n,
  availableReserveX: 0n,
  availableReserveY: 0n,
  totalLpSupply: 0n,
});
```

## Testing

All modules have comprehensive unit tests in the `__tests__` directory:

```bash
# Run all liquidity tests
pnpm --filter @dex-web/utils test src/liquidity/__tests__

# Run specific test file
pnpm --filter @dex-web/utils test src/liquidity/__tests__/liquidityParsers.test.ts
```

### Test Coverage

- **Schemas**: Validation rules, edge cases, type transformations
- **Parsers**: Amount parsing, decimal conversion, slippage calculations
- **Calculations**: LP token formulas, reserve calculations, rounding behavior
- **Transformer**: End-to-end transformation, token sorting, payload generation

## Key Algorithms

### LP Token Calculation

For new pools:
```
lpTokens = sqrt(amountX * amountY)
```

For existing pools:
```
lpFromX = (amountX / reserveX) * totalLpSupply
lpFromY = (amountY / reserveY) * totalLpSupply
lpTokens = min(lpFromX, lpFromY)
```

### Available Reserves

Reserves available for trading after subtracting protocol fees and locked amounts:
```
availableReserveX = reserveX - protocolFeeX - userLockedX
availableReserveY = reserveY - protocolFeeY - userLockedY
```

### Slippage for Max Amounts

```
maxAmount = amount * (1 + slippagePercent / 100)
```

## Decimal Precision

All calculations use Decimal.js with:
- **Precision**: 40 digits (to avoid floating point errors)
- **Rounding**: ROUND_DOWN (conservative for user funds)

This ensures accurate calculations even with large numbers and many decimal places.

## Migration from Old Code

The refactored code maintains backward compatibility:

- All exports from `addLiquidityTransformer.ts` remain unchanged
- The `transformAddLiquidityInput` function has the same signature
- Internal implementation is now modular and testable

### What Changed

**Before**: Monolithic file with mixed concerns, console.log statements, hard to test
**After**: Modular architecture with:
- Separated validation (schemas)
- Pure parsing functions
- Isolated calculation logic
- Comprehensive test coverage
- No side effects

### Removed

- Console.log statements (replaced with proper error handling)
- Unused `_calculateLpTokensToReceive` function (replaced with exported version)
- Inline Decimal.js configuration (moved to separate module)

## Best Practices

1. **Always validate inputs** using the provided Zod schemas
2. **Use bigint for raw token amounts** to avoid precision loss
3. **Use Decimal.js for intermediate calculations** to maintain precision
4. **Round down amounts** when converting to raw units (protects users)
5. **Round up max amounts** with slippage (allows transactions to succeed)
6. **Test edge cases**: zero amounts, new pools, very large/small numbers

## Related Modules

- `blockchain/sortSolanaAddresses.ts` - Token address sorting for X/Y convention
- `common/unitConversion.ts` - Generic unit conversion utilities
- `common/amountUtils.ts` - Amount formatting and parsing

## Future Improvements

- [ ] Add JSDoc examples to all public functions
- [ ] Create benchmark tests for large calculations
- [ ] Add property-based tests with fast-check
- [ ] Consider extracting common Decimal operations
- [ ] Add integration tests with mock pool data
