import { ERROR_MESSAGES, isWarningMessage } from "@dex-web/core";
import { client } from "@dex-web/orpc";
import {
  addLiquidityInputSchema,
  mapAmountsToProtocol,
  type TokenOrderContext,
  transformAddLiquidityInput,
} from "@dex-web/utils";
import type { Wallet } from "@solana/wallet-adapter-react";
import type { PublicKey } from "@solana/web3.js";
import { LIQUIDITY_CONSTANTS } from "../_constants/liquidityConstants";
import type {
  LiquidityFormValues,
  PoolDetails,
} from "../_types/liquidity.types";

/**
 * Pure validation function that throws errors without side effects.
 *
 * Following Implementation Answer #7: Pure functions should only throw errors,
 * not perform side effects like showing toasts. The calling hook handles side effects.
 */
export function validateTransactionInputs(params: {
  effectivePublicKey: PublicKey | null | undefined;
  walletAdapter:
    | {
        wallet: unknown;
      }
    | null
    | undefined;
  wallet: Wallet | null;
  currentPoolData: PoolDetails | null;
}): void {
  if (
    !params.effectivePublicKey ||
    !params.walletAdapter?.wallet ||
    !params.wallet?.adapter?.publicKey
  ) {
    throw new Error(ERROR_MESSAGES.MISSING_WALLET_INFO);
  }
  if (!params.currentPoolData) {
    throw new Error(
      "Pool not found for the selected token pair. Please create a pool first.",
    );
  }
}

/**
 * Pure function to classify and format transaction errors.
 * Returns error information without performing side effects.
 *
 * Following Implementation Answer #7: Helper functions are pure.
 * The calling hook decides how to display the error (toast, etc.).
 *
 * @returns Object with error message, type (warning/error), and context
 */
export function classifyTransactionError(params: {
  error: unknown;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
  tokenAAmount: string;
  tokenBAmount: string;
}): {
  message: string;
  isWarning: boolean;
  context: {
    tokenA: string | null;
    tokenB: string | null;
    amountA: string;
    amountB: string;
  };
} {
  const errorMessage =
    params.error instanceof Error ? params.error.message : String(params.error);
  const isWarning = isWarningMessage(params.error);

  const context = {
    amountA: params.tokenAAmount,
    amountB: params.tokenBAmount,
    tokenA: params.tokenAAddress,
    tokenB: params.tokenBAddress,
  };

  return {
    context,
    isWarning,
    message: errorMessage,
  };
}

/**
 * Async function to fetch token metadata for both tokens
 */
export async function fetchTokenMetadata(params: {
  trimmedTokenAAddress: string;
  trimmedTokenBAddress: string;
}): Promise<{
  tokenAMeta: { decimals: number };
  tokenBMeta: { decimals: number };
}> {
  const tokenMetadata = await client.tokens.getTokenMetadata({
    addresses: [params.trimmedTokenAAddress, params.trimmedTokenBAddress],
    returnAsObject: true,
  });

  if (
    !tokenMetadata ||
    typeof tokenMetadata !== "object" ||
    Array.isArray(tokenMetadata)
  ) {
    throw new Error("Invalid token metadata response");
  }

  const tokenAMeta = tokenMetadata[params.trimmedTokenAAddress];
  const tokenBMeta = tokenMetadata[params.trimmedTokenBAddress];

  if (!tokenAMeta || !tokenBMeta) {
    throw new Error("Failed to fetch token metadata for decimals");
  }

  return { tokenAMeta, tokenBMeta };
}

/**
 * Pure function to build the add liquidity request payload.
 *
 * Uses the TokenOrderContext to ensure tokens are correctly
 * mapped from UI order (A/B) to protocol order (X/Y) with the right decimals.
 * This eliminates duplicate sorting and ensures consistency throughout the flow.
 */
export function buildRequestPayload(params: {
  currentPoolData: PoolDetails;
  trimmedTokenAAddress: string;
  trimmedTokenBAddress: string;
  tokenAMeta: { decimals: number };
  tokenBMeta: { decimals: number };
  values: LiquidityFormValues;
  effectivePublicKey: PublicKey;
  orderContext: TokenOrderContext;
}) {
  const { orderContext } = params;

  const uiAmounts = {
    amountA: params.values.tokenAAmount,
    amountB: params.values.tokenBAmount,
    tokenA: orderContext.ui.tokenA,
    tokenB: orderContext.ui.tokenB,
  };

  const protocolAmounts = mapAmountsToProtocol(uiAmounts, orderContext);

  const poolReserves = {
    protocolFeeX: String(params.currentPoolData.protocolFeeX || 0),
    protocolFeeY: String(params.currentPoolData.protocolFeeY || 0),
    reserveX: String(params.currentPoolData.tokenXReserveRaw || 0),
    reserveY: String(params.currentPoolData.tokenYReserveRaw || 0),
    totalLpSupply: String(params.currentPoolData.totalSupplyRaw || 0),
    userLockedX: String(params.currentPoolData.userLockedX || 0),
    userLockedY: String(params.currentPoolData.userLockedY || 0),
  };

  const transformInput = addLiquidityInputSchema.parse({
    poolReserves,
    slippage: params.values.slippage || LIQUIDITY_CONSTANTS.DEFAULT_SLIPPAGE,
    tokenAAddress: protocolAmounts.tokenX,
    tokenAAmount: protocolAmounts.amountX,
    tokenADecimals: orderContext.mapping.tokenAIsX
      ? params.tokenAMeta.decimals
      : params.tokenBMeta.decimals,
    tokenBAddress: protocolAmounts.tokenY,
    tokenBAmount: protocolAmounts.amountY,
    tokenBDecimals: orderContext.mapping.tokenAIsX
      ? params.tokenBMeta.decimals
      : params.tokenAMeta.decimals,
    userAddress: params.effectivePublicKey.toBase58(),
  });

  return transformAddLiquidityInput(transformInput);
}
