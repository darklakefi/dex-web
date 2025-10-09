export const LIQUIDITY_CONSTANTS = Object.freeze({
  DEBOUNCE_DELAY_MS: 500,
  DEFAULT_AMOUNT: "0",
  DEFAULT_INITIAL_PRICE: "1",
  DEFAULT_SLIPPAGE: "0.5", // 0.5% default slippage for liquidity operations
  LP_TOKEN_DECIMALS: 9,
  MAX_DECIMAL_PLACES: 5,
  MAX_TRANSACTION_ATTEMPTS: 15,
  POLLING_INTERVAL_MS: 3000,
  TRANSACTION_RETRY_DELAY_MS: 2000,
} as const);

export const FORM_FIELD_NAMES = Object.freeze({
  INITIAL_PRICE: "initialPrice",
  SLIPPAGE: "slippage",
  TOKEN_A_AMOUNT: "tokenAAmount",
  TOKEN_B_AMOUNT: "tokenBAmount",
} as const);

export const TRANSACTION_STATES = Object.freeze({
  EDITING: "editing",
  ERROR: "error",
  SUBMITTING: "submitting",
  SUCCESS: "success",
} as const);

export const STATE_MACHINE_EVENTS = Object.freeze({
  RESET: "RESET",
  RETRY: "RETRY",
  SUBMIT: "SUBMIT",
  TRANSACTION_ERROR: "TRANSACTION_ERROR",
  TRANSACTION_SUCCESS: "TRANSACTION_SUCCESS",
} as const);
