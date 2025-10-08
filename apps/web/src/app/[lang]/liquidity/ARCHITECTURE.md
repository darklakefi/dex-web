# Liquidity Feature Architecture

This document describes the architectural patterns and design decisions for the liquidity feature.

## Table of Contents
- [Core Patterns](#core-patterns)
- [State Management](#state-management)
- [Hook Organization](#hook-organization)
- [Validation Strategy](#validation-strategy)
- [Calculation Libraries](#calculation-libraries)
- [Transaction Flow](#transaction-flow)

## Core Patterns

### Conductor Pattern

**Location**: `useLiquidityFormLogic.ts` (lines 18-23)

The liquidity feature follows the **Conductor Pattern** for managing complex state interactions:

```typescript
/**
 * Conductor pattern: orchestrates multiple hooks as siblings and wires them together explicitly.
 * - Query hooks own server state
 * - Form hook owns field state
 * - Machine hook owns workflow state
 * This hook mediates between them without creating nested dependencies.
 */
```

**Key Principles**:
- ✅ **XState machines** own workflow state (submitting → success/error)
- ✅ **TanStack Query** owns server state (pool data, token balances)
- ✅ **TanStack Form** owns form state (inputs, validation)
- ✅ **React hooks** own UI state (slippage, modals)

**Why This Works**:
- Clear ownership boundaries
- No circular dependencies
- Easy to test each layer independently
- Predictable data flow

## State Management

### XState Machine States

**File**: `_machines/liquidityMachine.ts`

The state machine manages **workflow states only**, not data loading states:

```
ready
  ├─ idle (waiting for user input)
  └─ calculating (user-initiated calculation in progress)
submitting (transaction being prepared)
signing (awaiting wallet signature)
success (transaction confirmed)
error (transaction failed, auto-reset after 5s)
```

**Important Distinction**:
- Machine states = User workflow (submit → sign → success)
- Query states = Data loading (`isLoading`, `isError`, `isSuccess`)

**When to Use**:
- Use machine states for transaction workflow tracking
- Use React Query states for data fetching status
- Don't duplicate states between the two systems

## Hook Organization

### Why 9+ Hooks?

The liquidity feature intentionally separates concerns across multiple hooks following the **Single Responsibility Principle**:

#### Transaction Hooks
- `useLiquidityTransaction` - Orchestration layer
- `useLiquidityTransactionCore` - XState machine wrapper
- `useLiquidityTransactionQueries` - TanStack Query operations

#### Form Hooks
- `useLiquidityFormState` - Form state management (✅ Current)
- `useLiquidityForm` - Deprecated, being phased out

#### Calculation Hooks
- `useLiquidityCalculations` - Calculation coordination
- `useLiquidityAmountDebouncer` - Debounced calculations

#### Validation Hooks
- `useLiquidityValidation` - Validation logic

#### Orchestration
- `useLiquidityFormLogic` - Conductor that wires everything together

**Benefits**:
- Each hook has a single, clear purpose
- Easy to test in isolation
- Easy to understand and modify
- Follows SOLID principles

## Validation Strategy

### Layered Validation

The liquidity forms use **three intentional layers** of validation:

```
Layer 1: Zod Schemas
├─ Type validation
├─ Format validation
└─ Schema: liquidityFormSchema

Layer 2: TanStack Form Validators
├─ onChange validators (real-time feedback)
├─ onBlur validators (on field exit)
├─ onDynamic validators (conditional validation)
└─ UX-focused validation timing

Layer 3: Utility Functions
├─ Reusable validation logic
├─ Example: validateHasSufficientBalance
└─ Shared across components
```

### Validation Best Practices

**DO**:
- Use Zod schemas for type/format validation
- Use `onChange` validators with utility functions for balance checks
- Keep validation utilities in `_utils/` if feature-specific
- Keep validation consistent across all form fields

**DON'T**:
- Don't inline validation logic in form config (use utilities)
- Don't use `onDynamic` validators (prefer `onChange`)
- Don't mix validation approaches inconsistently

### Validator Timing

- `onChange`: Real-time validation as user types (✅ Preferred for balance checks)
- `onBlur`: Validation when field loses focus (✅ For format validation)
- `onDynamic`: Conditional validation based on other fields (⚠️ Avoid, use `onChange` instead)

## Calculation Libraries

### Dual Library Architecture

The liquidity feature uses **two math libraries intentionally**:

```typescript
// Decimal.js - For precision math
import { calculateLpTokensToMint } from "@dex-web/utils/liquidity/liquidityMath";
// Use for: LP calculations, price calculations, SDK-matching math

// BigNumber.js - For fast validation
import BigNumber from "bignumber.js";
// Use for: Form validation, balance comparisons, quick checks
```

**Why Both?**:
- **Decimal.js**: High precision (40 digits), matches `@darklakefi/ts-sdk-on-chain` exactly
- **BigNumber.js**: Fast comparisons, good enough for validation, already in bundle

**Rules**:
- ✅ Use Decimal.js for all LP token calculations
- ✅ Use BigNumber.js for all form validation
- ❌ Don't mix them in the same calculation
- ❌ Don't use plain JavaScript math for financial calculations

### Calculation File Structure

```
libs/utils/src/liquidity/
└── liquidityMath.ts           ← Core math (Decimal.js, matches SDK)
    ├── calculateLpTokensToMint
    ├── calculateTokensFromLpBurn
    ├── calculateTokenAmountForRatio
    ├── calculatePoolShare
    └── applySlippage

apps/web/.../liquidity/_utils/
├── calculateLpTokens.ts       ← Thin wrapper for web app
└── liquidityCalculations.ts   ← 🗑️ Deprecated, being phased out
```

**Migration Path**:
1. New code → Use `liquidityMath.ts` functions
2. Old code → Gradually migrate away from `liquidityCalculations.ts`
3. Tests → Can use deprecated functions until migration complete

## Transaction Flow

### Generic Transaction Signing

**Location**: `apps/web/src/app/_utils/requestTransactionSigning.ts`

Common transaction signing logic is extracted into a generic utility:

```typescript
requestTransactionSigning({
  transactionType: 'addLiquidity' | 'createPool',
  // ... common params
})
```

**Benefits**:
- ~200 lines of duplication eliminated
- Consistent error handling
- Consistent toast notifications
- Easy to add new transaction types

### Feature-Specific Wrappers

**Location**: `apps/web/src/app/[lang]/liquidity/_utils/`

Feature-specific wrappers provide domain-specific configuration:

```typescript
// requestLiquidityTransactionSigning.ts
export async function requestLiquidityTransactionSigning(props) {
  return requestTransactionSigning({
    ...props,
    transactionType: "addLiquidity",
  });
}
```

**Why Wrappers?**:
- Domain-specific parameter names
- Feature-specific configuration
- Easy to extend with custom logic
- Keeps generic utility clean

## Form Context Management

### Scoped Form Contexts

Each form creates its own isolated context:

```typescript
// CreatePoolForm.tsx
const { fieldContext, formContext } = createFormHookContexts();

// LiquidityForm.tsx (via useLiquidityFormState)
const { fieldContext, formContext } = createFormHookContexts();

// WithdrawLiquidityModal.tsx
const { fieldContext, formContext } = createFormHookContexts();
```

**Why Not Shared?**:
- Forms have different fields and validation rules
- Prevents accidental cross-form state pollution
- Each form can be tested in isolation
- Follows React best practices for context scoping

## Ref Pattern for Async Coordination

### Why Refs in useLiquidityFormLogic?

```typescript
const sendRef = useRef<((event: { type: string }) => void) | null>(null);
const formRef = useRef<{ reset: () => void } | null>(null);
```

**Purpose**: Form and machine need to coordinate without causing re-renders

**Why Not Callbacks?**:
- Refs avoid circular dependencies between hooks
- Prevent re-render cascades
- Enable loose coupling in conductor pattern
- Machine can trigger form reset without form needing to know about machine

**This is intentional and correct for the conductor pattern.**

## Deprecated Code

### Current Deprecations

1. **useLiquidityForm.ts** - Replaced by `useLiquidityFormState.ts`
   - Only used in tests
   - Will be removed after test migration

2. **liquidityCalculations.ts** - Replaced by `liquidityMath.ts`
   - Functions marked `@deprecated`
   - Only used in tests
   - Gradual migration in progress

### Deprecation Process

1. Mark with `@deprecated` JSDoc comment
2. Document replacement in deprecation notice
3. Gradually migrate usage sites
4. Update tests last
5. Delete after all migrations complete

## Testing Strategy

### Test Organization

```
_components/__tests__/
├── LiquidityForm.spec.tsx          - Main integration tests
├── LiquidityForm.basic.spec.tsx    - Basic functionality
├── LiquidityForm.simple.spec.tsx   - Simple scenarios
├── LiquidityForm.edge-cases.spec.tsx - Edge cases
└── CreatePoolForm.spec.tsx         - Create pool tests

_utils/__tests__/
├── liquidityCalculations.test.ts   - Calculation tests
├── liquidityIntegration.test.ts    - Integration tests
├── priceCalculations.test.ts       - Price calculations
└── liquidityEdgeCases.test.ts      - Edge cases
```

### Testing Principles

- Unit tests for pure functions
- Integration tests for hook interactions
- Component tests for UI behavior
- Keep tests close to implementation
- Use mocks for external dependencies

## File Organization

### Directory Structure

```
liquidity/
├── _components/        - React components
├── _hooks/            - Custom hooks (9+ hooks, intentional)
├── _utils/            - Utility functions (feature-specific)
├── _types/            - TypeScript types
├── _constants/        - Constants
├── _machines/         - XState machines
├── _providers/        - React context providers
├── _workers/          - Web workers (unused, deleted)
└── ARCHITECTURE.md    - This file
```

### Naming Conventions

- Components: PascalCase (`LiquidityForm.tsx`)
- Hooks: camelCase with `use` prefix (`useLiquidityForm.ts`)
- Utils: camelCase (`validateHasSufficientBalance.ts`)
- Types: PascalCase (`LiquidityFormValues`)
- Constants: SCREAMING_SNAKE_CASE (`LIQUIDITY_CONSTANTS`)

## Key Takeaways

1. ✅ **Conductor Pattern** separates concerns cleanly
2. ✅ **9+ hooks is intentional**, not fragmentation
3. ✅ **Layered validation** provides better UX
4. ✅ **Dual library architecture** balances precision and performance
5. ✅ **Refs for coordination** prevent re-render cascades
6. ✅ **Scoped form contexts** prevent cross-form pollution
7. ✅ **Generic transaction signing** eliminates duplication

## Questions?

For questions about architecture decisions, see:
- Conductor pattern: `useLiquidityFormLogic.ts:18-23`
- State machine: `_machines/liquidityMachine.ts`
- Validation: This document, section "Validation Strategy"
- Calculations: `libs/utils/src/liquidity/liquidityMath.ts`
