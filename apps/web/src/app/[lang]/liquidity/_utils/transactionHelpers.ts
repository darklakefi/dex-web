import { ERROR_MESSAGES, isWarningMessage } from "@dex-web/core";
import { client } from "@dex-web/orpc";
import {
  addLiquidityInputSchema,
  transformAddLiquidityInput,
} from "@dex-web/utils";
import type { Wallet } from "@solana/wallet-adapter-react";
import type { PublicKey } from "@solana/web3.js";
import { LIQUIDITY_CONSTANTS } from "../_constants/liquidityConstants";
import type {
  LiquidityFormValues,
  PoolDetails,
} from "../_types/liquidity.types";
import {
  showErrorToast,
  showInfoToast,
} from "../_utils/liquidityTransactionToasts";
import { mapTokensUIToProtocol } from "./tokenMapping";

/**
 * Pure validation function to check if transaction inputs are valid
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
    showErrorToast({ message: ERROR_MESSAGES.MISSING_WALLET_INFO });
    throw new Error(ERROR_MESSAGES.MISSING_WALLET_INFO);
  }
  if (!params.currentPoolData) {
    const errorMsg =
      "Pool not found for the selected token pair. Please create a pool first.";
    showErrorToast({ message: errorMsg });
    throw new Error(errorMsg);
  }
}

/**
 * Pure function to handle transaction errors
 */
export function handleTransactionError(params: {
  error: unknown;
  tokenAAddress: string | null;
  tokenBAddress: string | null;
  tokenAAmount: string;
  tokenBAmount: string;
}): void {
  const errorMessage =
    params.error instanceof Error ? params.error.message : String(params.error);
  const isWarning = isWarningMessage(params.error);

  const context = {
    amountA: params.tokenAAmount,
    amountB: params.tokenBAmount,
    tokenA: params.tokenAAddress,
    tokenB: params.tokenBAddress,
  };

  if (isWarning) {
    showInfoToast({
      context,
      message: errorMessage,
    });
  } else {
    showErrorToast({
      context,
      message: errorMessage,
    });
  }
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
 * Uses the central token mapping utility to ensure tokens are correctly
 * mapped from UI order (A/B) to protocol order (X/Y) with the right decimals.
 */
export function buildRequestPayload(params: {
  currentPoolData: PoolDetails;
  trimmedTokenAAddress: string;
  trimmedTokenBAddress: string;
  tokenAMeta: { decimals: number };
  tokenBMeta: { decimals: number };
  values: LiquidityFormValues;
  effectivePublicKey: PublicKey;
}) {
  // Step 1: Create immutable token pair in UI order
  const tokenPairUI = {
    tokenA: {
      address: params.trimmedTokenAAddress,
      decimals: params.tokenAMeta.decimals,
    },
    tokenB: {
      address: params.trimmedTokenBAddress,
      decimals: params.tokenBMeta.decimals,
    },
  };

  // Step 2: Map to protocol order (X/Y) - this is our source of truth
  const protocolMapping = mapTokensUIToProtocol(tokenPairUI);

  // Step 3: Build pool reserves
  const poolReserves = {
    protocolFeeX: String(params.currentPoolData.protocolFeeX || 0),
    protocolFeeY: String(params.currentPoolData.protocolFeeY || 0),
    reserveX: String(params.currentPoolData.tokenXReserveRaw || 0),
    reserveY: String(params.currentPoolData.tokenYReserveRaw || 0),
    totalLpSupply: String(params.currentPoolData.totalSupplyRaw || 0),
    userLockedX: String(params.currentPoolData.userLockedX || 0),
    userLockedY: String(params.currentPoolData.userLockedY || 0),
  };

  // Step 4: Build transform input using the mapped tokens
  // IMPORTANT: We pass tokenA/B in UI order, but with CORRECT decimals from the mapping
  const transformInput = addLiquidityInputSchema.parse({
    poolReserves,
    slippage: params.values.slippage || LIQUIDITY_CONSTANTS.DEFAULT_SLIPPAGE,
    tokenAAddress: params.trimmedTokenAAddress,
    tokenAAmount: params.values.tokenAAmount,
    tokenADecimals: tokenPairUI.tokenA.decimals,
    tokenBAddress: params.trimmedTokenBAddress,
    tokenBAmount: params.values.tokenBAmount,
    tokenBDecimals: tokenPairUI.tokenB.decimals,
    userAddress: params.effectivePublicKey.toBase58(),
  });

  // Step 5: Transform to final payload
  // The transformer will internally sort and map everything correctly
  return transformAddLiquidityInput(transformInput);
}
