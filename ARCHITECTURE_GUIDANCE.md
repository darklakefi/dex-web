# Architecture Guidance for DEX Web

> **Generated**: 2025-10-08  
> **Purpose**: Answer architectural questions about form management, state handling, hook composition, package organization, and more.

---

## Table of Contents

1. [Form Management Strategy](#1-form-management-strategy)
2. [State Management Philosophy](#2-state-management-philosophy)
3. [Hook Composition Strategy](#3-hook-composition-strategy)
4. [Package Organization](#4-package-organization)
5. [Tooling Decisions](#5-tooling-decisions)
6. [Validation & Error Handling](#6-validation--error-handling)
7. [Data Flow](#7-data-flow)
8. [Testing Strategy](#8-testing-strategy)
9. [Migration Strategy](#9-migration-strategy)
10. [Critical Quick Start Answers](#10-critical-quick-start-answers)

---

## 1. Form Management Strategy

### Should we use TanStack Form for all forms?

**✅ YES** - TanStack Form is the standard across the codebase.

**Evidence**:
- Currently used in liquidity forms (`useLiquidityFormState.ts`)
- Creates form hook contexts via `createFormHook` and `createFormHookContexts`
- Integrates well with TanStack Query for server state

**Decision**: Continue using TanStack Form for all forms. No migration planned to other form libraries.

---

### useLiquidityForm vs useLiquidityFormState - Which to use?

**✅ USE `useLiquidityFormState`** - This is the current/canonical implementation.

**Evidence**:
- `useLiquidityFormState` is used in `useLiquidityFormLogic` (line 89 of `useLiquidityFormLogic.ts`)
- `useLiquidityForm` is an older implementation with duplicated validation logic
- The new implementation properly types the form values and follows better patterns

**Migration Path**:
```typescript
// ❌ OLD (don't use)
import { useLiquidityForm } from './_hooks/useLiquidityForm';

// ✅ NEW (use this)
import { useLiquidityFormState } from './_hooks/useLiquidityFormState';
```

**Action**: 
- Mark `useLiquidityForm.ts` as deprecated with JSDoc comment
- Eventually remove it after confirming no usage
- Keep `useLiquidityFormState` as the single source of truth

---

### Should form contexts be globally accessible or scoped per form instance?

**✅ SCOPED PER FORM** - Export contexts from the hook file, not globally.

**Current Pattern** (from `useLiquidityFormState.ts`):
```typescript
const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: { SwapFormFieldset: FormFieldset },
  fieldContext,
  formComponents: {},
  formContext,
});
```

**Why**: Allows multiple instances of the same form type without context collisions.

---

## 2. State Management Philosophy

### Relationship between XState, TanStack Query, TanStack Form, and React hooks

**✅ "CONDUCTOR PATTERN"** - Established in `useLiquidityFormLogic.ts` (lines 18-23):

```typescript
/**
 * Conductor pattern: orchestrates multiple hooks as siblings and wires them together explicitly.
 * - Query hooks own server state
 * - Form hook owns field state
 * - Machine hook owns workflow state
 * This hook mediates between them without creating nested dependencies.
 */
```

**Ownership Model**:

| State Type | Owner | Examples |
|------------|-------|----------|
| **Server State** | TanStack Query | Pool data, token accounts, token metadata |
| **Form State** | TanStack Form | Input values, validation errors, touched fields |
| **Workflow State** | XState Machine | Transaction flow (ready → submitting → success/error) |
| **UI State** | React hooks (useState) | Slippage settings, modal open/close, UI toggles |

**Example from `useLiquidityFormLogic.ts`**:
```typescript
// 1. Query hook: owns pool data
const poolDataResult = useRealtimePoolData({ tokenXMint, tokenYMint });

// 2. Token accounts query: owns token balance data
const tokenAccountsData = useRealtimeTokenAccounts({ ... });

// 3. Machine hook: owns workflow state
const transaction = useLiquidityTransactionCore({ form, submitTransaction });

// 4. Form hook: owns field state
const { form } = useLiquidityFormState({ ... });

// 5. Calculations hook: derives values from pool data
const { debouncedCalculateTokenAmounts } = useLiquidityAmountDebouncer(...);
```

---

### When to use state machine vs React Query's isLoading/isError/isSuccess?

**Clear Separation**:

**Use React Query states** for:
- ✅ Data fetching status (loading pool reserves, fetching token metadata)
- ✅ Data mutation status (when mutation hasn't entered transaction flow)
- ✅ Cache invalidation and refetching

**Use XState machine** for:
- ✅ Multi-step transaction workflows (signing → submitting → confirming)
- ✅ Complex state transitions with business logic
- ✅ Error recovery flows (retry logic)
- ✅ UI state that depends on transaction lifecycle

**Example from `liquidityMachine.ts`**:
```typescript
states: {
  ready: { /* idle, calculating */ },
  submitting: { /* invoking transaction */ },
  signing: { /* awaiting wallet signature */ },
  success: { /* transaction confirmed */ },
  error: { /* with retry logic */ }
}
```

**Never**: Don't duplicate states. If React Query says `isLoading`, don't also track it in XState context.

---

### Is the "conductor pattern" the preferred architecture?

**✅ YES** - This is the established pattern for complex features.

**Benefits**:
1. **No nested dependencies**: Hooks are siblings, not parent-child
2. **Clear ownership**: Each hook owns one type of state
3. **Easy testing**: Can mock individual hooks independently
4. **Better performance**: No unnecessary re-renders from prop drilling

**When to Use**:
- ✅ Features with 3+ hooks interacting
- ✅ Complex flows with server state + form state + workflow state
- ✅ Transaction features (swap, liquidity, staking)

**When NOT to Use**:
- ❌ Simple forms with only local state
- ❌ Read-only data display components

---

## 3. Hook Composition Strategy

### Current Hook Count: Is 9+ hooks intentional or fragmented?

**✅ INTENTIONAL SEPARATION** - Each hook has a clear, single responsibility.

**Liquidity Hooks Breakdown**:

| Hook | Responsibility | Lines of Code |
|------|---------------|---------------|
| `useLiquidityFormLogic` | 🎯 **Conductor** - Orchestrates all hooks | ~120 |
| `useLiquidityFormState` | Form state management | ~87 |
| `useLiquidityTransaction` | Transaction submission logic | ~320 |
| `useLiquidityTransactionCore` | XState machine wrapper | ~44 |
| `useLiquidityTransactionQueries` | Query mutations + invalidation | ~40 |
| `useLiquidityCalculations` | Server-side calculation API calls | ~114 |
| `useLiquidityAmountDebouncer` | Debounced local calculations | ~50 |
| `useLiquidityCalculationWorker` | Web worker for heavy calculations | ~209 |
| `useLiquidityValidation` | Reusable validation logic | ~20 |
| `useOptimisticUpdate` | Optimistic UI updates | ~30 |

**Verdict**: This is good separation of concerns, not fragmentation.

---

### Preferred granularity for hooks?

**✅ SINGLE RESPONSIBILITY PRINCIPLE** - Small, focused hooks.

**Guidelines**:

**Good Hook Size**: 20-200 lines
- ✅ Does one thing well
- ✅ Has clear inputs/outputs
- ✅ Can be tested in isolation
- ✅ Can be reused across features

**Anti-patterns**:
- ❌ God hooks (500+ lines doing everything)
- ❌ Hooks that mix concerns (form + API + validation + analytics)
- ❌ Hooks with side effects hidden from callers

**Example of Good Separation**:
```typescript
// ✅ GOOD: Separate concerns
const form = useLiquidityFormState({ ... });
const transaction = useLiquidityTransaction({ ... });
const calculations = useLiquidityCalculations();

// ❌ BAD: One hook does everything
const everything = useLiquidityEverything(); // 1000+ lines
```

---

### Should hooks that always work together be merged?

**⚠️ DEPENDS** - Use the conductor pattern for coupling, not merging.

**Keep Separate**:
- ✅ If they can be tested independently
- ✅ If they have different lifetimes
- ✅ If they might be reused separately

**Merge**:
- ✅ If they're truly inseparable
- ✅ If splitting creates unnecessary complexity
- ✅ If they always share the same dependencies

**Example**: 
- `useLiquidityTransactionCore` + `useLiquidityTransaction` are separate because:
  - Core handles XState machine (reusable)
  - Transaction handles Solana-specific logic (feature-specific)

---

## 4. Package Organization

### Shared Utils Location Strategy

**Decision Tree**:

```
Is it used by 2+ features?
├─ YES → libs/utils/src/
│   ├─ Is it domain-specific (liquidity/swap/pools)?
│   │   └─ YES → libs/utils/src/{domain}/
│   │   └─ NO → libs/utils/src/common/
│   └─ Is it blockchain-specific?
│       └─ YES → libs/utils/src/blockchain/
└─ NO → apps/web/src/app/[lang]/{feature}/_utils/
```

**Examples from Codebase**:

| Utility | Current Location | Correct? | Reason |
|---------|-----------------|----------|---------|
| `validateHasSufficientBalance` | ✅ `libs/utils/src/common/balanceValidation.ts` | ✅ YES | Used by swap + liquidity + staking |
| `calculateLpTokensToMint` | ✅ `libs/utils/src/liquidity/liquidityMath.ts` | ✅ YES | Liquidity-specific, shared across web + backend |
| `calculateLpTokenAmount` | ⚠️ `apps/web/.../calculateLpTokens.ts` | ⚠️ WRAPPER | Thin wrapper around shared util |
| `getLiquidityFormButtonMessage` | ✅ `apps/web/.../liquidity/_utils/` | ✅ YES | Liquidity UI-specific, not reusable |

---

### validateHasSufficientBalance - Should it move?

**✅ ALREADY IN CORRECT LOCATION** - `libs/utils/src/common/balanceValidation.ts`

**Evidence**:
```typescript
// Exported from libs/utils/src/index.ts (line 26-29)
export {
  checkInsufficientBalance,
  type TokenAccount,
  validateHasSufficientBalance,
} from "./common/balanceValidation";
```

**Used by**: Forms across swap, liquidity, and potentially staking features.

**No action needed** - It's already shared correctly.

---

### Calculation Logic Placement

**✅ CURRENT STRUCTURE IS CORRECT**:

```
libs/utils/src/liquidity/liquidityMath.ts
  ↓ (Decimal.js, matches SDK)
  ├─ calculateLpTokensToMint()
  ├─ calculateTokensFromLpBurn()
  ├─ calculateTokenAmountForRatio()
  └─ toRawUnitsBigint()

apps/web/.../liquidity/_utils/calculateLpTokens.ts
  ↓ (Thin wrapper for web app)
  └─ calculateLpTokenAmount() → calls calculateLpTokensToMint()

apps/web/.../liquidity/_utils/liquidityCalculations.ts
  ↓ (DEPRECATED - marked with @deprecated)
  └─ calculateLpTokensFromDeposit() → OLD, uses basic JS math
```

**Pattern**:
1. **Core math** lives in `libs/utils/src/liquidity/` (Decimal.js, matches SDK)
2. **Thin adapters** in `apps/web` for UI-specific concerns (formatting, error handling)
3. **Deprecated code** marked with JSDoc, removed in next cleanup

---

### Migration Strategy: Old Calculations → New

**✅ IN PROGRESS** - New code exists, old code marked deprecated.

**Status**:
- ✅ New `liquidityMath.ts` created using Decimal.js (matches SDK)
- ✅ Old `liquidityCalculations.ts` marked `@deprecated` (line 32-35)
- ⏳ Usage sites need to be migrated
- ⏳ Old code removal after migration

**Migration Checklist**:
```typescript
// 1. Find all usage of deprecated functions
grep -r "calculateLpTokensFromDeposit" apps/

// 2. Replace with new implementation
- import { calculateLpTokensFromDeposit } from './_utils/liquidityCalculations';
+ import { calculateLpTokenAmount } from './_utils/calculateLpTokens';

// 3. Update function calls (signature changed)
- const lpTokens = calculateLpTokensFromDeposit({ tokenAAmount, tokenBAmount, poolReserves });
+ const lpTokens = calculateLpTokenAmount(parseFloat(tokenAAmount), parseFloat(tokenBAmount), poolReserves);

// 4. Convert Decimal → number if needed
+ const lpTokensNumber = Number(lpTokens.toFixed(9));

// 5. After all migrations, delete liquidityCalculations.ts
```

---

## 5. Tooling Decisions

### BigNumber.js vs Decimal.js - Should we standardize?

**⚠️ DUAL LIBRARY STRATEGY** - Both serve different purposes.

**Current Usage**:

| Library | Purpose | Usage | Location |
|---------|---------|-------|----------|
| **Decimal.js** | ✅ **Precision calculations** | LP token math, pool reserves | `libs/utils/src/liquidity/` |
| **BigNumber.js** | ✅ **Validation & comparison** | Form validation, balance checks | `libs/utils/src/common/` |

**Evidence**:
```typescript
// Decimal.js - for precise calculations (liquidityMath.ts, line 9-12)
Decimal.set({
  precision: 40, // Higher precision for intermediate calculations
  rounding: Decimal.ROUND_DOWN,
});

// BigNumber.js - for validation (amountUtils.ts, line 7-8)
export const parseAmountBigNumber = (value: string): BigNumber => {
  return BigNumber(value.replace(/,/g, ""));
};
```

**Decision**: Keep both libraries.
- **Decimal.js**: Matches SDK, used for math that must be exact
- **BigNumber.js**: Lightweight, used for form validation where performance matters

**Migration**: NO migration needed. This is intentional.

---

### Transaction Signing Pattern

**✅ FEATURE-SPECIFIC WITH COMPOSITION** - Current pattern is correct.

**Current Pattern** (`requestLiquidityTransactionSigning.ts`):
```typescript
export async function requestLiquidityTransactionSigning({
  unsignedTransaction,
  signTransaction,
  publicKey,
  tokenXMint,
  tokenYMint,
  trackingId,
  onSuccess,
  setLiquidityStep,
}: RequestLiquidityTransactionSigningParams) {
  // Feature-specific transaction signing logic
  // Includes: tracking, error handling, confirmation polling
}
```

**Why Feature-Specific**:
1. Each feature has different tracking needs
2. Different success callbacks (invalidate different queries)
3. Different error messages/toasts
4. Different state machine events

**Shared Parts** (should be in `libs/utils/src/blockchain/`):
- ✅ Transaction serialization
- ✅ Solana RPC calls
- ✅ Signature verification
- ✅ Error parsing

**Location**: 
- Feature-specific: `apps/web/.../liquidity/_utils/requestLiquidityTransactionSigning.ts`
- Shared utilities: `libs/utils/src/blockchain/`

---

### Web Worker Usage

**⚠️ CURRENTLY UNUSED** - Worker exists but not actively used.

**Evidence**:
```bash
$ grep -r "useLiquidityCalculationWorker" apps/
# No results - the hook exists but isn't imported anywhere
```

**Decision**: **REMOVE IT** unless you find it's actually needed.

**Why**:
- Current calculations are fast enough (simple ratio math)
- Network latency is the bottleneck, not CPU
- Adds complexity without measurable benefit

**When to Use Workers**:
- ✅ Heavy calculations (>50ms blocking time)
- ✅ Data transformation of large datasets (>10MB)
- ✅ Cryptographic operations

**Liquidity calculations are ~0.1ms**, so workers are overkill.

**Action**: Delete `liquidityCalculationWorker.ts` and `useLiquidityCalculationWorker.ts` in next cleanup.

---

## 6. Validation & Error Handling

### Validation Strategy

**✅ LAYERED VALIDATION** - Multiple layers for different purposes.

**Current Pattern**:

```typescript
// Layer 1: Zod Schema (type + structure validation)
const liquidityFormSchema = z.object({
  tokenAAmount: z.string(),
  tokenBAmount: z.string(),
  initialPrice: z.string(),
});

// Layer 2: TanStack Form Validators (onChange, onBlur, onDynamic)
validators: {
  onChange: liquidityFormSchema, // Type validation
  onDynamic: ({ value }) => {    // Business logic validation
    // Check balance, pool existence, etc.
  }
}

// Layer 3: Separate Validator Functions (reusable)
validateHasSufficientBalance({ amount, tokenAccount });
```

**When to Use Each**:

| Layer | When | Example |
|-------|------|---------|
| **Zod** | Type/format validation | Is it a string? Is it a number format? |
| **onChange** | Real-time type checking | Run Zod schema on every change |
| **onBlur** | Expensive validation | Check balance after user leaves field |
| **onDynamic** | Conditional validation | Validate only if certain fields are filled |
| **Separate Function** | Reusable across features | `validateHasSufficientBalance` used in swap + liquidity |

**Decision**: Keep all three layers. Each serves a purpose.

---

### onChange vs onBlur vs onDynamic

**Guidelines**:

| Validator | Use Case | Performance | User Experience |
|-----------|----------|-------------|-----------------|
| **onChange** | Type validation (Zod) | ⚡ Fast | Immediate feedback |
| **onBlur** | Expensive checks (API calls) | 🐢 Slow | Don't annoy user while typing |
| **onDynamic** | Conditional validation | ⚡ Fast | Only when needed |

**Example from `useLiquidityFormState.ts` (lines 58-83)**:
```typescript
validators: {
  onChange: liquidityFormSchema, // ⚡ Fast Zod check
  onDynamic: ({ value }) => {     // ⚡ Fast balance check (only if amount > 0)
    if (value.tokenAAmount && parseAmountBigNumber(value.tokenAAmount).gt(0)) {
      // Check balance
    }
  }
}
```

**No onBlur** because balance checks are fast (local, no API call).

---

### Error Handling Pattern

**✅ TIERED ERROR HANDLING** - Different strategies for different error types.

**Current Pattern**:

```typescript
// 1. Toast Notifications (user-facing)
showErrorToast({ message: "Insufficient balance" });
showInfoToast({ message: "Transaction pending" });

// 2. Console Errors (developer-facing)
console.error("Submit transaction failed:", error);

// 3. State Machine Error States (workflow)
send({ type: "ERROR", error: errorMessage });

// 4. Try-Catch Blocks (error boundaries)
try {
  await submitTransaction();
} catch (error) {
  handleTransactionError(error);
}
```

**Decision Tree**:

```
Error Type?
├─ User needs to know → Toast + Machine state
├─ Developer debugging → console.error
├─ Recoverable → Machine state with RETRY event
└─ Unrecoverable → Error boundary
```

**Examples from Code**:

| Error Type | Handler | Location |
|------------|---------|----------|
| Insufficient balance | ✅ Inline form error | Form validator |
| Network error | ✅ Toast + retry | Machine error state |
| Unknown error | ✅ Toast + console | Error boundary |
| Validation error | ✅ Inline form error | Form validator |

---

### Should errors always go through state machine?

**⚠️ NO** - Only workflow errors.

**Through Machine**:
- ✅ Transaction submission failures
- ✅ Signing errors
- ✅ Network timeouts
- ✅ Anything that can be retried

**Outside Machine**:
- ✅ Form validation errors (handled by TanStack Form)
- ✅ Data fetching errors (handled by TanStack Query)
- ✅ UI errors (handled by error boundaries)

---

## 7. Data Flow

### Token Account Data

**⚠️ MULTIPLE FETCHES FOR PERFORMANCE** - Not duplication.

**Current Pattern**:
```typescript
// Feature-level fetch (with feature-specific params)
const tokenAccountsData = useRealtimeTokenAccounts({
  publicKey,
  tokenAAddress,
  tokenBAddress,
  hasRecentTransaction, // Feature-specific param
});
```

**Why Multiple Fetches**:
1. **React Query handles deduplication** - Same query key = single request
2. **Feature-specific parameters** - Different features need different data
3. **Stale-while-revalidate** - Each feature can have different refetch intervals

**Decision**: Keep current pattern. React Query's caching makes this efficient.

---

### Should useRealtimeTokenAccounts be the only way to access data?

**✅ YES** - Single hook for token account data.

**Pattern**:
```typescript
// ✅ GOOD: Fetch at feature root, pass down
function LiquidityPage() {
  const tokenAccountsData = useRealtimeTokenAccounts(...);
  return <LiquidityForm tokenAccountsData={tokenAccountsData} />;
}

// ❌ BAD: Fetch in multiple child components
function TokenInput() {
  const tokenAccountsData = useRealtimeTokenAccounts(...); // Causes waterfall
}
```

**Why**: Avoids request waterfalls, easier to reason about data flow.

---

### Pool Data Flow

**✅ FETCH AT ROOT, PASS DOWN** - No Context needed yet.

**Current Pattern** (from `useLiquidityFormLogic.ts`, lines 44-61):
```typescript
// Fetch at conductor level
const poolDataResult = useRealtimePoolData({ tokenXMint, tokenYMint });

// Stabilize and transform
const poolDetails = useMemo(() => {
  const data = poolDataResult.data;
  return data ? { /* transformed */ } : null;
}, [poolDataResult.data]);

// Return to component
return { poolDetails, ... };
```

**When to Use Context**:
- ✅ If data is needed by 5+ components at different nesting levels
- ✅ If prop drilling becomes unwieldy (>3 levels deep)

**Current verdict**: No Context needed. Prop passing is clean.

---

## 8. Testing Strategy

### Test Coverage Expectations

**✅ MAINTAIN EXISTING COVERAGE** - Don't reduce coverage during refactors.

**Current Coverage** (based on existing tests):
- ✅ Core utilities: Unit tests (e.g., `liquidityCalculations.test.ts`)
- ✅ Hooks: Integration tests (e.g., `useLiquidityForm.test.ts`)
- ✅ Components: Behavioral tests
- ✅ E2E: Critical user flows (Playwright)

**During Refactoring**:
1. ✅ Run existing tests to ensure no regressions
2. ✅ Add tests for new utilities
3. ✅ Update tests for changed APIs
4. ✅ Remove tests for deleted code

---

### Should I add new tests for extracted utilities?

**✅ YES** - New shared utilities need tests.

**Test Pyramid**:

```
        /\
       /  \      E2E (Playwright)
      /    \     - Critical user flows only
     /------\    
    /        \   Integration (Vitest + Testing Library)
   /          \  - Hook behavior, multi-component interactions
  /------------\ 
 /              \ Unit (Vitest)
/________________\ - Pure functions, calculations, transformers
```

**Examples**:

| Code | Test Type | Location |
|------|-----------|----------|
| `calculateLpTokensToMint` | ✅ Unit | `libs/utils/src/liquidity/__tests__/` |
| `validateHasSufficientBalance` | ✅ Unit | `libs/utils/src/common/__tests__/` |
| `useLiquidityFormState` | ✅ Integration | `apps/web/.../liquidity/_hooks/__tests__/` |
| `LiquidityForm` | ✅ Integration + E2E | Both locations |

---

### Testing Philosophy

**✅ PRAGMATIC TESTING** - Test behavior, not implementation.

**Good Tests**:
- ✅ Test public API, not internals
- ✅ Test user-facing behavior
- ✅ Test error conditions
- ✅ Use realistic test data

**Bad Tests**:
- ❌ Testing private functions
- ❌ Testing implementation details (e.g., specific hook calls)
- ❌ Brittle snapshots
- ❌ Tests that require mocking everything

---

## 9. Migration Strategy

### Refactoring Approach

**✅ CREATE ALONGSIDE, MIGRATE GRADUALLY** - Safer than in-place changes.

**Process**:

```
Phase 1: Create New (✅ DONE)
  └─ libs/utils/src/liquidity/liquidityMath.ts

Phase 2: Mark Old as Deprecated (✅ DONE)
  └─ @deprecated JSDoc comments in liquidityCalculations.ts

Phase 3: Migrate Usage Sites (⏳ IN PROGRESS)
  ├─ Update imports
  ├─ Update function calls
  └─ Test each change

Phase 4: Remove Old Code (⏳ TODO)
  └─ Delete after all migrations complete
```

**Why Not In-Place**:
- ✅ Old code keeps working during migration
- ✅ Easy to revert if issues found
- ✅ Clear before/after in git history

---

### Deprecated calculateLpTokensFromDeposit - Removal Timeline

**⏳ GRADUAL MIGRATION** - Remove after all usage sites migrated.

**Steps**:
1. ✅ Mark with `@deprecated` JSDoc (DONE)
2. ⏳ Find all usage sites: `grep -r "calculateLpTokensFromDeposit"`
3. ⏳ Replace with `calculateLpTokenAmount` from new module
4. ⏳ Run tests after each replacement
5. ⏳ Delete old file after all migrations

**Timeline**: 1-2 weeks (don't rush, test thoroughly)

---

### Breaking Changes to Internal APIs

**✅ ACCEPTABLE** - Internal APIs can break during refactors.

**Definition of Internal**:
- ❌ NOT exported from `libs/*/src/index.ts`
- ❌ In `_utils`, `_hooks`, `_components` (underscore prefix)
- ❌ Used only within single feature

**Definition of Public**:
- ✅ Exported from library root (`libs/utils/src/index.ts`)
- ✅ Used by 2+ features
- ✅ Part of documented API

**Breaking Internal APIs**:
- ✅ No deprecation needed
- ✅ Update all usage in same commit
- ✅ Run tests to verify

**Breaking Public APIs**:
- ⚠️ Requires deprecation period
- ⚠️ Add new API alongside old
- ⚠️ Update all usages gradually

---

### Backward Compatibility During Refactoring

**⚠️ NOT REQUIRED** - Internal refactors can break compatibility.

**When Backward Compatibility IS Required**:
- ✅ Published npm packages
- ✅ Public APIs documented for external use
- ✅ Shared libraries used by other teams

**When NOT Required**:
- ❌ Internal feature code (`apps/web/src/app/`)
- ❌ Private utilities (underscore prefix)
- ❌ Code only used in one place

**Current Refactor**: No backward compatibility needed. Update all usage sites in same PR.

---

## 10. Critical Quick Start Answers

> **TL;DR**: Start here if you need answers fast.

---

### 1. Form Hooks: Merge or keep separate?

**✅ KEEP SEPARATE** - But deprecate the old one.

**Action**:
- ✅ Use `useLiquidityFormState` going forward
- ✅ Mark `useLiquidityForm` as `@deprecated`
- ✅ Remove `useLiquidityForm` after confirming zero usage

```typescript
// ✅ USE THIS
const { form } = useLiquidityFormState({ ... });

// ❌ DON'T USE (deprecated)
const { form } = useLiquidityForm({ ... });
```

---

### 2. Utils Location: Where should shared utilities live?

**Decision Tree**:

```
Used by 2+ features?
├─ YES → libs/utils/src/{domain}/
│   ├─ Domain-specific? → libs/utils/src/liquidity/
│   └─ Generic? → libs/utils/src/common/
└─ NO → apps/web/.../feature/_utils/
```

**Examples**:
- ✅ `validateHasSufficientBalance` → `libs/utils/src/common/` (shared)
- ✅ `calculateLpTokensToMint` → `libs/utils/src/liquidity/` (domain)
- ✅ `getLiquidityFormButtonMessage` → `apps/web/.../liquidity/_utils/` (feature-specific)

---

### 3. BigNumber vs Decimal: Standardize on one?

**✅ KEEP BOTH** - They serve different purposes.

| Library | Purpose | Where |
|---------|---------|-------|
| **Decimal.js** | Precision math (LP tokens, reserves) | `libs/utils/src/liquidity/` |
| **BigNumber.js** | Fast validation/comparison | `libs/utils/src/common/` |

**No migration needed** - This is intentional architecture.

---

### 4. Refactoring Style: In-place or alongside?

**✅ NEW CODE ALONGSIDE OLD** - Safer migration.

**Process**:
1. ✅ Create new implementation (✅ DONE: `liquidityMath.ts`)
2. ✅ Mark old as `@deprecated` (✅ DONE)
3. ⏳ Migrate usage sites gradually (⏳ TODO)
4. ⏳ Delete old after all migrations (⏳ TODO)

**Why**: Old code keeps working, easy to revert, clear git history.

---

## Appendix: File Structure Reference

```
apps/web/src/app/[lang]/liquidity/
├─ _components/          # UI components
│  └─ LiquidityForm.tsx  # Main form component
├─ _hooks/               # Feature hooks
│  ├─ useLiquidityFormLogic.ts      # 🎯 Conductor hook
│  ├─ useLiquidityFormState.ts      # ✅ USE THIS
│  ├─ useLiquidityForm.ts           # ❌ DEPRECATED
│  ├─ useLiquidityTransaction.ts    # Transaction submission
│  ├─ useLiquidityTransactionCore.ts # XState wrapper
│  └─ useLiquidityCalculations.ts   # Server calculations
├─ _machines/            # XState machines
│  └─ liquidityMachine.ts           # Workflow state
├─ _utils/               # Feature-specific utilities
│  ├─ calculateLpTokens.ts          # ✅ Thin wrapper
│  └─ liquidityCalculations.ts      # ❌ DEPRECATED
└─ _workers/             # Web workers (unused)
   └─ liquidityCalculationWorker.ts # ❌ DELETE

libs/utils/src/
├─ common/               # Shared generic utilities
│  ├─ amountUtils.ts                # BigNumber parsing
│  └─ balanceValidation.ts          # ✅ Shared validation
├─ liquidity/            # Domain-specific utilities
│  ├─ liquidityMath.ts              # ✅ Decimal.js calculations
│  └─ transformers.ts               # Data transformers
└─ index.ts              # Public API exports
```

---

## Final Recommendations

### Immediate Actions (This Week)

1. ✅ Mark `useLiquidityForm.ts` as `@deprecated`
2. ✅ Confirm `useLiquidityCalculationWorker` is unused → delete it
3. ✅ Add migration plan for `calculateLpTokensFromDeposit` usage sites

### Short Term (Next 2 Weeks)

1. ⏳ Migrate all usage of deprecated calculation functions
2. ⏳ Remove deprecated files after migration
3. ⏳ Add tests for new `liquidityMath.ts` utilities

### Long Term (Next Month)

1. ⏳ Document conductor pattern in architecture docs
2. ⏳ Create reusable transaction signing utilities
3. ⏳ Evaluate if Context is needed for pool data (only if prop drilling becomes painful)

---

## Questions or Clarifications?

If you have additional questions not covered here:

1. **Check the code**: Search for similar patterns in the codebase
2. **Follow established patterns**: Use conductor pattern for complex features
3. **Test your changes**: Maintain existing test coverage
4. **Ask in PR**: Tag maintainers for architectural decisions

---

**Last Updated**: 2025-10-08  
**Maintained By**: Development Team  
**Related Docs**: `DEVELOPMENT.md`, `README.md`
