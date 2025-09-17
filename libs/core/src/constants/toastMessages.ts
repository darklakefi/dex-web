export const TRANSACTION_STEPS = {
  STEP_1: {
    SWAP: "Generating zero-knowledge proof [1/3]",
    LIQUIDITY: "Generating zero-knowledge proof [1/3]",
    POOL_CREATION: "Preparing Pool Creation [1/3]",
  },
  STEP_2: {
    SWAP: "Confirm trade [2/3]",
    LIQUIDITY: "Confirm liquidity transaction [2/3]", 
    POOL_CREATION: "Confirm Pool Creation [2/3]",
  },
  STEP_3: {
    SWAP: "Verify slippage requirements [3/3]",
    LIQUIDITY: "Processing liquidity transaction [3/3]",
    POOL_CREATION: "Creating Pool [3/3]",
  },
} as const;

export const TRANSACTION_DESCRIPTIONS = {
  STEP_1: {
    SWAP: "Hiding your slippage tolerance from mev bot until verification. this may take a few seconds.",
    LIQUIDITY: "Hiding your slippage tolerance from MEV bots until verification. This may take a few seconds.",
    POOL_CREATION: "Preparing pool creation transaction. This may take a few seconds.",
  },
  STEP_2: {
    SWAP: "Tokens will be secured until slippage verification completes.",
    LIQUIDITY: "Please confirm the liquidity transaction in your wallet.",
    POOL_CREATION: "Please confirm the pool creation transaction in your wallet.",
  },
  STEP_3: {
    SWAP: "Checking if swap stayed within your hidden slippage tolerance before finalizing trade.",
    LIQUIDITY: "Processing your liquidity transaction on the blockchain.",
    POOL_CREATION: "Processing your pool creation transaction on the blockchain.",
  },
} as const;

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Wallet not connected!",
  WALLET_NO_SIGNING: "Wallet does not support transaction signing!",
  MISSING_WALLET_INFO: "Missing wallet address or token information",
  MISSING_TOKEN_ADDRESSES: "Missing token addresses",
  MISSING_WALLET: "Missing wallet",
  INVALID_AMOUNTS: "Please enter valid amounts for both tokens",
  INVALID_PRICE: "Please enter a valid initial price",
  CONNECT_WALLET_TO_CREATE_POOL: "Please connect your wallet to create a pool",
} as const;

export const SUCCESS_MESSAGES = {
  SWAP_COMPLETE: "Swap complete",
  LIQUIDITY_ADDED: "Liquidity Added Successfully", 
  POOL_CREATED: "Pool Created",
  PROPOSAL_CREATED: "Proposal created",
} as const;

export const BUTTON_MESSAGES = {
  ENTER_AMOUNT: "enter an amount",
  HIGH_PRICE_IMPACT: "CONFIRM SWAP WITH {value}% PRICE IMPACT",
  INSUFFICIENT_BALANCE: "insufficient",
  LOADING: "loading",
  SWAP: "swap",
  CREATE_POOL: "Create Pool",
} as const;

export type TransactionType = "SWAP" | "LIQUIDITY" | "POOL_CREATION";
export type TransactionStep = "STEP_1" | "STEP_2" | "STEP_3";