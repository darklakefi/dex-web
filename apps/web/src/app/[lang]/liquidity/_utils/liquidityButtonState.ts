import type { ValidationState } from "../_hooks/useLiquidityValidation";
import type { PoolDetails } from "../_types/liquidity.types";

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
  | "DISABLED"
  | "ERROR";

export interface ButtonStateRule {
  condition: () => boolean;
  result: ButtonState;
}

export interface ButtonStateProps {
  validation: ValidationState;
  poolDetails: PoolDetails | null;
  hasWallet: boolean;
  isPoolLoading: boolean;
  isTokenAccountsLoading: boolean;
  isCalculating: boolean;
  hasAnyAmount?: boolean;
  formCanSubmit?: boolean;
  isFormSubmitting?: boolean;
  isError?: boolean;
}

export function getLiquidityButtonState({
  validation,
  poolDetails,
  hasWallet,
  isPoolLoading,
  isTokenAccountsLoading,
  isCalculating,
  hasAnyAmount = false,
  formCanSubmit = false,
  isFormSubmitting = false,
  isError = false,
}: ButtonStateProps): ButtonState {
  if (isError) {
    return "ERROR";
  }

  if (isFormSubmitting) {
    return "SUBMITTING";
  }

  if (isPoolLoading || isTokenAccountsLoading) {
    return "LOADING";
  }

  if (isCalculating) {
    return "CALCULATING";
  }

  if (!hasWallet) {
    return "DISABLED";
  }

  if (validation.errors?.general === "Select different tokens") {
    return "SAME_TOKENS";
  }

  if (validation.hasInsufficientBalance) {
    return "INSUFFICIENT_BALANCE";
  }

  if (!poolDetails) {
    if (!validation.hasAmounts) {
      if (hasAnyAmount) {
        return "CALCULATING";
      }
      return "ENTER_AMOUNTS";
    }

    if (validation.errors?.initialPrice === "Invalid price") {
      return "INVALID_PRICE";
    }

    if (formCanSubmit) {
      return "CREATE_POOL";
    }

    return "CALCULATING";
  } else {
    if (!validation.hasAmounts) {
      if (hasAnyAmount) {
        return "CALCULATING";
      }
      return "ENTER_AMOUNT";
    }

    if (formCanSubmit) {
      return "ADD_LIQUIDITY";
    }

    return "CALCULATING";
  }
}

export function getButtonMessage(state: ButtonState): string {
  const messages: Record<ButtonState, string> = {
    ADD_LIQUIDITY: "Add Liquidity",
    CALCULATING: "Calculating amounts...",
    CREATE_POOL: "Create Pool",
    DISABLED: "Connect Wallet",
    ENTER_AMOUNT: "Enter an amount",
    ENTER_AMOUNTS: "Enter token amounts",
    ERROR: "Retry Transaction",
    INSUFFICIENT_BALANCE: "Insufficient balance",
    INVALID_PRICE: "Invalid price",
    LOADING: "Loading...",
    SAME_TOKENS: "Select different tokens",
    SUBMITTING: "Processing Transaction...",
  };

  return messages[state];
}

export function isButtonDisabled(state: ButtonState): boolean {
  const disabledStates: ButtonState[] = [
    "LOADING",
    "CALCULATING",
    "INSUFFICIENT_BALANCE",
    "SAME_TOKENS",
    "INVALID_PRICE",
    "DISABLED",
    "ENTER_AMOUNTS",
    "ENTER_AMOUNT",
  ];

  return disabledStates.includes(state);
}

export function isButtonLoading(state: ButtonState): boolean {
  return state === "SUBMITTING" || state === "CALCULATING";
}

export function getButtonSeverity(
  state: ButtonState,
): "info" | "warning" | "error" | "success" {
  switch (state) {
    case "INSUFFICIENT_BALANCE":
    case "SAME_TOKENS":
    case "INVALID_PRICE":
    case "ERROR":
      return "error";
    case "ENTER_AMOUNTS":
    case "ENTER_AMOUNT":
    case "LOADING":
    case "CALCULATING":
      return "info";
    case "CREATE_POOL":
    case "ADD_LIQUIDITY":
      return "success";
    default:
      return "info";
  }
}
