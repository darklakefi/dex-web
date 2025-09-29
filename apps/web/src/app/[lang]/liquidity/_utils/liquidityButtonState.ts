import type { ValidationState } from "../_hooks/useLiquidityValidation";
import type { LiquidityMachineContext } from "../_machines/liquidityMachine";
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
  formCanSubmit?: boolean;
  isFormSubmitting?: boolean;
}

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
  if (isFormSubmitting ||
      machineContext.liquidityStep === 1 ||
      machineContext.liquidityStep === 2 ||
      machineContext.liquidityStep === 3) {
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
      return "ENTER_AMOUNTS";
    }

    if (validation.errors?.initialPrice === "Invalid price") {
      return "INVALID_PRICE";
    }

    if (validation.hasAmounts) {
      return "CREATE_POOL";
    }

    return "ENTER_AMOUNTS";
  } else {
    if (!validation.hasAmounts) {
      return "ENTER_AMOUNT";
    }

    if (validation.canSubmit) {
      return "ADD_LIQUIDITY";
    }

    return "ENTER_AMOUNT";
  }
}

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

export function isButtonLoading(state: ButtonState): boolean {
  return state === "SUBMITTING" || state === "CALCULATING";
}

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