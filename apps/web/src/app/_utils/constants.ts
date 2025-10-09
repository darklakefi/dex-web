// Devnet vs Mainnet default tokens
const isDevnet = process.env.NEXT_PUBLIC_NETWORK === "2";

export const DEFAULT_SELL_TOKEN =
  process.env.NEXT_PUBLIC_DEFAULT_SELL_TOKEN ||
  (isDevnet
    ? "So11111111111111111111111111111111111111112" // SOL (wrapped) on devnet
    : "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump");

export const DEFAULT_BUY_TOKEN =
  process.env.NEXT_PUBLIC_DEFAULT_BUY_TOKEN ||
  (isDevnet
    ? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" // USDC on devnet
    : "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

export const EMPTY_TOKEN = "empty";

export const LIQUIDITY_PAGE_TYPE = {
  ADD_LIQUIDITY: "add-liquidity",
  CREATE_POOL: "create-pool",
};
