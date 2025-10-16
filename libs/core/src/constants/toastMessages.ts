export const TRANSACTION_STEPS = {
  STEP_1: {
    LIQUIDITY: "Depositing into {token-x-symbol}/{token-y-symbol} pool",
    POOL_CREATION: "Preparing Pool Creation",
    SWAP: "Generating zero-knowledge proof",
  },
  STEP_2: {
    LIQUIDITY: "Confirm liquidity transaction",
    POOL_CREATION: "Confirm Pool Creation",
    SWAP: "Confirm trade",
  },
  STEP_3: {
    LIQUIDITY: "Processing liquidity transaction",
    POOL_CREATION: "Creating Pool",
    SWAP: "Verify slippage requirements",
  },
} as const;

export const TRANSACTION_DESCRIPTIONS = {
  STEP_1: {
    LIQUIDITY:
      "Hiding your slippage tolerance from MEV bots until verification. This may take a few seconds.",
    POOL_CREATION:
      "Preparing pool creation transaction. This may take a few seconds.",
    SWAP: "Hiding your slippage tolerance from mev bot until verification. this may take a few seconds.",
  },
  STEP_2: {
    LIQUIDITY: "Please confirm the liquidity transaction in your wallet.",
    POOL_CREATION:
      "Please confirm the pool creation transaction in your wallet.",
    SWAP: "Tokens will be secured until slippage verification completes.",
  },
  STEP_3: {
    LIQUIDITY: "Processing your liquidity transaction on the blockchain.",
    POOL_CREATION:
      "Processing your pool creation transaction on the blockchain.",
    SWAP: "Checking if swap stayed within your hidden slippage tolerance before finalizing trade.",
  },
} as const;

export const ERROR_MESSAGES = {
  CONNECT_WALLET_TO_CREATE_POOL: "Please connect your wallet to create a pool",
  INVALID_AMOUNTS: "Please enter valid amounts for both tokens",
  INVALID_PRICE: "Please enter a valid initial price",
  MISSING_TOKEN_ADDRESSES: "Missing token addresses",
  MISSING_WALLET: "Missing wallet",
  MISSING_WALLET_INFO: "Missing wallet address or token information",
  WALLET_NO_SIGNING: "Wallet does not support transaction signing!",
  WALLET_NOT_CONNECTED: "Wallet not connected!",
} as const;

export const SUCCESS_MESSAGES = {
  LIQUIDITY_ADDED: "Liquidity Added Successfully",
  POOL_CREATED: "Pool Created",
  PROPOSAL_CREATED: "Proposal created",
  SWAP_COMPLETE: "Swap complete",
} as const;

export const BUTTON_MESSAGES = {
  CREATE_POOL: "Create Pool",
  ENTER_AMOUNT: "enter an amount",
  HIGH_PRICE_IMPACT: "CONFIRM SWAP WITH {value}% PRICE IMPACT",
  INSUFFICIENT_BALANCE: "insufficient",
  LOADING: "loading",
  SWAP: "swap",
} as const;

export type TransactionType = "SWAP" | "LIQUIDITY" | "POOL_CREATION";
export type TransactionStep = "STEP_1" | "STEP_2" | "STEP_3";
