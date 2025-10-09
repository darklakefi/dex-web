# Token Order Management

## Overview

This module manages the critical distinction between **UI Order** (how users select tokens) and **Protocol Order** (how Solana sorts tokens).

## The Core Problem

When a user adds liquidity to a pool:
1. They select Token A and Token B in their preferred order
2. Solana's protocol requires tokens in a **deterministic sorted order**
3. We must correctly map between these two representations

## Critical: Solana Buffer Sorting

⚠️ **Solana does NOT use lexicographic string sorting** ⚠️

Solana uses **buffer comparison** of the underlying public key bytes, NOT alphabetical sorting of the base58 string representation.

### Example

```typescript
// ❌ WRONG: String lexicographic order
const tokens = ["EPjFW...(USDC)", "So111...(SOL)"].sort();
// Result: ["EPjFW...", "So111..."]  ← INCORRECT!

// ✅ CORRECT: Solana buffer comparison
const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "So11111111111111111111111111111111111111112"   // SOL
);
// Result: tokenX = SOL, tokenY = USDC  ← CORRECT!
```

### Real-World Token Sorting

| Token | Address Prefix | String Sort Position | Buffer Sort Position |
|-------|---------------|---------------------|---------------------|
| USDC  | `EPjF...`     | 1st (E < S)        | **3rd** ⚠️          |
| USDT  | `Es9v...`     | 2nd (E < S)        | **2nd** ⚠️          |
| SOL   | `So11...`     | 3rd (S last)       | **1st** ⚠️          |

## Architecture

### Files

- **`tokenOrder.ts`** - Pure functions for creating contexts and mapping amounts
- **`tokenOrderTypes.ts`** - Type definitions using branded types for compile-time safety
- **`tokenOrder.test.ts`** - Comprehensive test suite (100% coverage)

### Key Functions

#### `createTokenOrderContext()`
Creates the single source of truth for token ordering. Call this ONCE per token pair.

```typescript
const context = createTokenOrderContext(userTokenA, userTokenB);
// context.ui         - User's selection order
// context.protocol   - Solana's sorted order
// context.mapping    - How to convert between them
```

#### `mapAmountsToProtocol()`
Converts user input amounts to protocol-ready payload.

```typescript
const protocolPayload = mapAmountsToProtocol(
  { amountA: "100", amountB: "200", ...uiTokens },
  context
);
// Ready to send to blockchain
```

#### `mapAmountsToUI()`
Converts protocol response back to user's original order.

```typescript
const displayAmounts = mapAmountsToUI(protocolResult, context);
// Safe to show to user in their expected order
```

## Usage Patterns

### ✅ Correct Usage

```typescript
// 1. Create context ONCE
const context = createTokenOrderContext(tokenA, tokenB);

// 2. Store context, use everywhere
const protocolData = mapAmountsToProtocol(userInput, context);
const queryKey = [context.protocol.tokenX, context.protocol.tokenY];
const displayData = mapAmountsToUI(protocolResponse, context);
```

### ❌ Incorrect Usage

```typescript
// ❌ DON'T: Call sortSolanaAddresses multiple times
const sort1 = sortSolanaAddresses(tokenA, tokenB);
const sort2 = sortSolanaAddresses(tokenA, tokenB); // Redundant!

// ❌ DON'T: Sort strings
const sorted = [tokenA, tokenB].sort(); // Wrong order!

// ❌ DON'T: Manually swap logic
if (tokenA > tokenB) { /* manual swap */ } // Incorrect comparison!
```

## Testing Philosophy

Our tests verify:

1. **Actual Solana behavior** - Not our assumptions
2. **Round-trip correctness** - UI → Protocol → UI preserves data
3. **Determinism** - Same inputs always produce same outputs
4. **Edge cases** - Same token twice, invalid addresses, decimals

All tests use **real token addresses** to catch buffer sorting bugs.

## Common Pitfalls

### 1. Assuming Alphabetical Order

```typescript
// ❌ Intuition says USDC < SOL alphabetically
// ✅ Reality: SOL < USDC in buffer comparison
```

### 2. Inconsistent Ordering

```typescript
// ❌ Sorting in some places, not others
const poolKey1 = [tokenA, tokenB].sort();
const poolKey2 = [tokenX, tokenY]; // Unsorted!

// ✅ Always use context
const poolKey = [context.protocol.tokenX, context.protocol.tokenY];
```

### 3. Forgetting Amounts Swap Too

```typescript
// ❌ Swapping tokens but not amounts
const tokenX = tokenA > tokenB ? tokenB : tokenA;
const amountX = amountA; // Wrong!

// ✅ Use the mapping functions
const { amountX, amountY } = mapAmountsToProtocol(uiAmounts, context);
```

## Integration with React

### Hooks Pattern

```typescript
function LiquidityForm() {
  // 1. Get context from URL params
  const context = useTokenOrder(); // Custom hook wrapping createTokenOrderContext
  
  // 2. Use for queries
  const { data } = usePoolData({
    tokenX: context?.protocol.tokenX,
    tokenY: context?.protocol.tokenY,
  });
  
  // 3. Transform for submission
  const onSubmit = (formData) => {
    const protocolPayload = mapAmountsToProtocol(formData, context);
    submitTransaction(protocolPayload);
  };
}
```

## Performance Considerations

All functions are:
- **Pure** - No side effects, safe to memoize
- **Fast** - O(1) operations, no sorting after initial context creation
- **Cacheable** - Same inputs = same outputs (referential equality with React.useMemo)

## Further Reading

- [Solana PublicKey Documentation](https://solana-labs.github.io/solana-web3.js/classes/PublicKey.html)
- [Buffer.compare() Semantics](https://nodejs.org/api/buffer.html#bufcompareotherbuffer)
- See `TOKEN_ORDER_*.md` files in project root for implementation history
