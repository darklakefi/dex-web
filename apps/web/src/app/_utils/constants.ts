// Re-export SOL/WSOL utilities from libs/utils
export {
  getGatewayTokenAddress,
  getSolTokenDisplayName,
  getSolTokenType,
  isSolToken,
  isSolVariant,
  isWsolToken,
  SOL_MINTS,
  SOL_TOKEN_ADDRESS,
  SolTokenType,
  shouldUseNativeSolBalance,
  WSOL_TOKEN_ADDRESS,
} from "@dex-web/utils";

export const DEFAULT_SELL_TOKEN =
  process.env.NEXT_PUBLIC_DEFAULT_SELL_TOKEN ||
  "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump";
export const DEFAULT_BUY_TOKEN =
  process.env.NEXT_PUBLIC_DEFAULT_BUY_TOKEN ||
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export const EMPTY_TOKEN = "empty";

export const LIQUIDITY_PAGE_TYPE = {
  ADD_LIQUIDITY: "add-liquidity",
  CREATE_POOL: "create-pool",
};
