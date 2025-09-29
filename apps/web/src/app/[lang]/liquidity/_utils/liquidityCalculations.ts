import {
  parseAmount,
  parseAmountBigNumber,
  sortSolanaAddresses,
} from "@dex-web/utils";
import type { CreateLiquidityTransactionInput } from "@dex-web/orpc/schemas";
import type { PublicKey } from "@solana/web3.js";

interface PoolDetails {
  tokenXMint?: string;
  tokenYMint?: string;
}

interface TokenAmounts {
  tokenAAmount: string;
  tokenBAmount: string;
}

interface TokenAddresses {
  tokenAAddress: string;
  tokenBAddress: string;
}

export function calculateLiquidityAmounts(
  poolDetails: PoolDetails,
  { tokenAAmount, tokenBAmount }: TokenAmounts,
  {
    tokenAAddress: _tokenAAddress,
    tokenBAddress: _tokenBAddress,
  }: TokenAddresses,
): { maxAmountX: number; maxAmountY: number } {
  const sellAmount = parseAmount(tokenBAmount);
  const buyAmount = parseAmount(tokenAAmount);

  const isTokenXSell = poolDetails.tokenXMint === _tokenBAddress;
  const maxAmountX = isTokenXSell ? sellAmount : buyAmount;
  const maxAmountY = isTokenXSell ? buyAmount : sellAmount;

  return { maxAmountX, maxAmountY };
}

export function createLiquidityTransactionPayload(params: {
  tokenAmounts: TokenAmounts;
  tokenAddresses: TokenAddresses;
  slippage: string;
  publicKey: PublicKey;
  poolDetails: PoolDetails;
}): CreateLiquidityTransactionInput {
  const { tokenAmounts, tokenAddresses, slippage, publicKey, poolDetails } =
    params;

  const sortedTokens = sortSolanaAddresses(
    tokenAddresses.tokenAAddress,
    tokenAddresses.tokenBAddress,
  );

  const { tokenXAddress, tokenYAddress } = sortedTokens;

  if (!tokenXAddress || !tokenYAddress) {
    throw new Error("Invalid token addresses after sorting");
  }

  const { maxAmountX, maxAmountY } = calculateLiquidityAmounts(
    poolDetails,
    tokenAmounts,
    tokenAddresses,
  );

  return {
    maxAmountX,
    maxAmountY,
    slippage: Number(slippage),
    tokenXMint: tokenXAddress,
    tokenYMint: tokenYAddress,
    user: publicKey.toBase58(),
  };
}

export function calculateTokenAmountByPrice(
  inputAmount: string,
  price: string,
): string {
  if (
    parseAmountBigNumber(inputAmount).gt(0) &&
    parseAmountBigNumber(price).gt(0)
  ) {
    return parseAmountBigNumber(inputAmount).multipliedBy(price).toString();
  }
  return "0";
}

export function determineInputType(
  type: "buy" | "sell",
  poolDetails: PoolDetails | null,
  tokenAAddress: string | null,
  tokenBAddress: string | null,
): "tokenX" | "tokenY" {
  if (!poolDetails) return "tokenX";

  return (type === "sell" && poolDetails.tokenXMint === tokenBAddress) ||
    (type === "buy" && poolDetails.tokenXMint === tokenAAddress)
    ? "tokenX"
    : "tokenY";
}
