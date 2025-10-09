import { ERROR_MESSAGES, isWarningMessage } from "@dex-web/core";
import { client } from "@dex-web/orpc";
import {
  mapAmountsToProtocol,
  type TokenOrderContext,
  toRawUnitsBigNumberAsBigInt,
} from "@dex-web/utils";
import type { Wallet } from "@solana/wallet-adapter-react";
import type { PublicKey } from "@solana/web3.js";
import type { AddLiquidityVariables } from "../../../../hooks/mutations/useAddLiquidityMutation";
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
}): AddLiquidityVariables {
  const { orderContext } = params;

  const uiAmounts = {
    amountA: params.values.tokenAAmount,
    amountB: params.values.tokenBAmount,
    tokenA: orderContext.ui.tokenA,
    tokenB: orderContext.ui.tokenB,
  };

  const protocolAmounts = mapAmountsToProtocol(uiAmounts, orderContext);

  const tokenXDecimals = orderContext.mapping.tokenAIsX
    ? params.tokenAMeta.decimals
    : params.tokenBMeta.decimals;
  const tokenYDecimals = orderContext.mapping.tokenAIsX
    ? params.tokenBMeta.decimals
    : params.tokenAMeta.decimals;

  const maxAmountX = toRawUnitsBigNumberAsBigInt(
    Number.parseFloat(protocolAmounts.amountX) || 0,
    tokenXDecimals,
  );
  const maxAmountY = toRawUnitsBigNumberAsBigInt(
    Number.parseFloat(protocolAmounts.amountY) || 0,
    tokenYDecimals,
  );

  const reserveX = BigInt(params.currentPoolData.tokenXReserveRaw || 0);
  const reserveY = BigInt(params.currentPoolData.tokenYReserveRaw || 0);
  const totalLpSupply = BigInt(params.currentPoolData.totalSupplyRaw || 0);

  let amountLp: bigint;
  if (totalLpSupply === 0n) {
    amountLp = sqrt(maxAmountX * maxAmountY);
  } else {
    const lpFromX = (maxAmountX * totalLpSupply) / reserveX;
    const lpFromY = (maxAmountY * totalLpSupply) / reserveY;
    amountLp = lpFromX < lpFromY ? lpFromX : lpFromY;
  }

  return {
    amountLp,
    label: "",
    maxAmountX,
    maxAmountY,
    refCode: "",
    tokenMintX: protocolAmounts.tokenX,
    tokenMintY: protocolAmounts.tokenY,
    userAddress: params.effectivePublicKey.toBase58(),
  };
}

/**
 * Integer square root using Newton's method for bigint
 */
function sqrt(value: bigint): bigint {
  if (value < 0n) {
    throw new Error("Square root of negative number");
  }
  if (value < 2n) {
    return value;
  }

  let x0 = value / 2n;
  let x1 = (x0 + value / x0) / 2n;

  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + value / x0) / 2n;
  }

  return x0;
}
