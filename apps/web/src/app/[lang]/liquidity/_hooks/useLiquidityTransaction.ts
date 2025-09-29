"use client";

import { client } from "@dex-web/orpc";
import type { CreateLiquidityTransactionInput } from "@dex-web/orpc/schemas";
import { parseAmount, sortSolanaAddresses } from "@dex-web/utils";
import type { PublicKey } from "@solana/web3.js";
import { useCallback } from "react";

interface TokenDetails {
  tokenXMint: string;
  tokenYMint: string;
}

interface TransactionParams {
  tokenAAmount: string;
  tokenBAmount: string;
  tokenAAddress: string;
  tokenBAddress: string;
  slippage: string;
  publicKey: PublicKey;
  poolDetails: TokenDetails | null;
}

interface UseLiquidityTransactionProps {
  onSuccess: (signature?: string) => void;
  onError: (error: Error, context?: Record<string, any>) => void;
  checkTransactionStatus: (signature: string) => Promise<void>;
}

const DEFAULT_BUY_TOKEN = "So11111111111111111111111111111111111111112";
const DEFAULT_SELL_TOKEN = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const DEFAULT_SLIPPAGE = "0.5";

export function useLiquidityTransaction({
  onSuccess,
  onError,
  checkTransactionStatus,
}: UseLiquidityTransactionProps) {
  const executeTransaction = useCallback(async (params: TransactionParams) => {
    const {
      tokenAAmount,
      tokenBAmount,
      tokenAAddress,
      tokenBAddress,
      slippage,
      publicKey,
      poolDetails,
    } = params;

    try {
      const finalTokenAAddress = tokenAAddress?.trim() || DEFAULT_BUY_TOKEN;
      const finalTokenBAddress = tokenBAddress?.trim() || DEFAULT_SELL_TOKEN;

      const sortedTokens = sortSolanaAddresses(
        finalTokenAAddress,
        finalTokenBAddress,
      );

      const { tokenXAddress, tokenYAddress } = sortedTokens;

      if (!tokenXAddress || !tokenYAddress) {
        throw new Error("Invalid token addresses after sorting");
      }

      const sellAmount = parseAmount(tokenBAmount);
      const buyAmount = parseAmount(tokenAAmount);

      const isTokenXSell = poolDetails?.tokenXMint === tokenBAddress;
      const maxAmountX = isTokenXSell ? sellAmount : buyAmount;
      const maxAmountY = isTokenXSell ? buyAmount : sellAmount;

      const requestPayload: CreateLiquidityTransactionInput = {
        maxAmountX,
        maxAmountY,
        slippage: Number(slippage || DEFAULT_SLIPPAGE),
        tokenXMint: tokenXAddress,
        tokenYMint: tokenYAddress,
        user: publicKey.toBase58(),
      };

      const response = await client.liquidity.createLiquidityTransaction(requestPayload);

      if (!response.success || !response.transaction) {
        throw new Error("Failed to create liquidity transaction");
      }

      return response.transaction;
    } catch (error) {
      const contextualError = error instanceof Error ? error : new Error(String(error));
      onError(contextualError, {
        amountA: tokenAAmount,
        amountB: tokenBAmount,
        tokenA: tokenAAddress,
        tokenB: tokenBAddress,
      });
      throw contextualError;
    }
  }, [onError]);

  return {
    executeTransaction,
  };
}