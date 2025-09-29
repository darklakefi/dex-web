export const LIQUIDITY_CONSTANTS = Object.freeze({
  DEFAULT_SLIPPAGE: "0.5",
  DEFAULT_INITIAL_PRICE: "1",
  DEFAULT_AMOUNT: "0",
  MAX_DECIMAL_PLACES: 5,
  DEBOUNCE_DELAY_MS: 500,
  POLLING_INTERVAL_MS: 3000,
  TRANSACTION_RETRY_DELAY_MS: 2000,
  MAX_TRANSACTION_ATTEMPTS: 15,
} as const);

export const FORM_FIELD_NAMES = Object.freeze({
  TOKEN_A_AMOUNT: "tokenAAmount",
  TOKEN_B_AMOUNT: "tokenBAmount",
  INITIAL_PRICE: "initialPrice",
} as const);

export const TRANSACTION_STATES = Object.freeze({
  EDITING: "editing",
  SUBMITTING: "submitting",
  SUCCESS: "success",
  ERROR: "error",
} as const);

export const STATE_MACHINE_EVENTS = Object.freeze({
  SUBMIT: "SUBMIT",
  TRANSACTION_SUCCESS: "TRANSACTION_SUCCESS",
  TRANSACTION_ERROR: "TRANSACTION_ERROR",
  RESET: "RESET",
  RETRY: "RETRY",
} as const);
