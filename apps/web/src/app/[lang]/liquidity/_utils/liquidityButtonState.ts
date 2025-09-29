import type { ValidationState } from "../_hooks/useLiquidityValidation";
import type { LiquidityMachineContext } from "../_machines/enhancedLiquidityMachine";
import type { PoolDetails } from "../_types/liquidity.types";

/**
 * Button state utilities for liquidity form actions
 *
 * This module provides comprehensive button state management that integrates:
 * - XState machine states for transaction flow
 * - TanStack Form validation and submission states
 * - DeFi-specific validation (balance, slippage, etc.)
 * - Loading states for async operations
 * - Accessibility considerations
 */

export type ButtonState =
  | "SUBMITTING"
  | "CALCULATING"
  | "INSUFFICIENT_BALANCE"
  | "ENTER_AMOUNTS"
  | "ENTER_AMOUNT"
  | "CREATE_POOL"
  | "ADD_LIQUIDITY"
  | "SAME_TOKENS"
  | "INVALID_PRICE"
  | "LOADING"
  | "DISABLED";

export interface ButtonStateRule {
  condition: () => boolean;
  result: ButtonState;
}

export interface ButtonStateProps {
  machineContext: LiquidityMachineContext;
  validation: ValidationState;
  poolDetails: PoolDetails | null;
  hasWallet: boolean;
  isPoolLoading: boolean;
  isTokenAccountsLoading: boolean;
  isCalculating: boolean;
  /** TanStack Form canSubmit state */
  formCanSubmit?: boolean;
  /** TanStack Form isSubmitting state */
  isFormSubmitting?: boolean;
}

/**
 * Enhanced button state logic with TanStack Form integration
 *
 * Priority order (first match wins):
 * 1. Transaction/Machine states (submitting, calculating)
 * 2. Loading states (pool, token accounts)
 * 3. Wallet connection
 * 4. Validation errors (tokens, balance, price)
 * 5. Form states (amounts, submission readiness)
 */
export function getLiquidityButtonState({
  machineContext,
  validation,
  poolDetails,
  hasWallet,
  isPoolLoading,
  isTokenAccountsLoading,
  isCalculating,
  formCanSubmit = false,
  isFormSubmitting = false,
}: ButtonStateProps): ButtonState {
  // High priority states - transaction in progress
  if (isFormSubmitting ||
      machineContext.liquidityStep === 1 ||
      machineContext.liquidityStep === 2 ||
      machineContext.liquidityStep === 3) {
    return "SUBMITTING";
  }

  // Loading states
  if (isPoolLoading || isTokenAccountsLoading) {
    return "LOADING";
  }

  if (isCalculating) {
    return "CALCULATING";
  }

  // Wallet connection required
  if (!hasWallet) {
    return "DISABLED";
  }

  // Validation error states
  if (validation.errors?.general === "Select different tokens") {
    return "SAME_TOKENS";
  }

  if (validation.hasInsufficientBalance) {
    return "INSUFFICIENT_BALANCE";
  }

  // Pool-specific logic
  if (!poolDetails) {
    // Creating new pool
    if (!validation.hasAmounts) {
      return "ENTER_AMOUNTS";
    }

    if (validation.errors?.initialPrice === "Invalid price") {
      return "INVALID_PRICE";
    }

    // Has amounts and valid price - ready to create
    if (validation.hasAmounts && formCanSubmit) {
      return "CREATE_POOL";
    }

    return "ENTER_AMOUNTS";
  } else {
    // Adding to existing pool
    if (!validation.hasAmounts) {
      return "ENTER_AMOUNT";
    }

    // Check both validation and form state for full readiness
    if (validation.canSubmit && formCanSubmit) {
      return "ADD_LIQUIDITY";
    }

    return "ENTER_AMOUNT";
  }
}

/**
 * Get user-friendly button message based on state
 * Messages are optimized for clarity and actionability
 */
export function getButtonMessage(state: ButtonState): string {
  const messages: Record<ButtonState, string> = {
    SUBMITTING: "Processing Transaction...",
    CALCULATING: "Calculating amounts...",
    INSUFFICIENT_BALANCE: "Insufficient balance",
    ENTER_AMOUNTS: "Enter token amounts",
    ENTER_AMOUNT: "Enter an amount",
    CREATE_POOL: "Create Pool",
    ADD_LIQUIDITY: "Add Liquidity",
    SAME_TOKENS: "Select different tokens",
    INVALID_PRICE: "Invalid price",
    LOADING: "Loading...",
    DISABLED: "Connect Wallet"
  };

  return messages[state];
}

/**
 * Check if button should be disabled based on state
 */
export function isButtonDisabled(state: ButtonState): boolean {
  const disabledStates: ButtonState[] = [
    "LOADING",
    "CALCULATING",
    "INSUFFICIENT_BALANCE",
    "SAME_TOKENS",
    "INVALID_PRICE",
    "DISABLED",
    "ENTER_AMOUNTS",
    "ENTER_AMOUNT"
  ];

  return disabledStates.includes(state);
}

/**
 * Check if button should show loading state
 */
export function isButtonLoading(state: ButtonState): boolean {
  return state === "SUBMITTING" || state === "CALCULATING";
}

/**
 * Get button severity level for styling
 */
export function getButtonSeverity(state: ButtonState): 'info' | 'warning' | 'error' | 'success' {
  switch (state) {
    case "INSUFFICIENT_BALANCE":
    case "SAME_TOKENS":
    case "INVALID_PRICE":
      return 'error';
    case "ENTER_AMOUNTS":
    case "ENTER_AMOUNT":
    case "LOADING":
    case "CALCULATING":
      return 'info';
    case "CREATE_POOL":
    case "ADD_LIQUIDITY":
      return 'success';
    default:
      return 'info';
  }
}