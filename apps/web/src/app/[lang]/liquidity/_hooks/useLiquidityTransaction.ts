"use client";

import { client } from "@dex-web/orpc";
import type { CreateLiquidityTransactionInput } from "@dex-web/orpc/schemas";
import { parseAmount, sortSolanaAddresses } from "@dex-web/utils";
import type { PublicKey } from "@solana/web3.js";
import { useCallback } from "react";
import { useCreateLiquidityTransaction } from "../../../../hooks/mutations/useLiquidityMutations";

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
  onError: (error: Error, context?: Record<string, unknown>) => void;
  checkTransactionStatus: (signature: string) => Promise<void>;
}

const DEFAULT_BUY_TOKEN = "So11111111111111111111111111111111111111112";
const DEFAULT_SELL_TOKEN = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const DEFAULT_SLIPPAGE = "0.5";

export function useLiquidityTransaction({
  onSuccess: _onSuccess,
  onError: _onError,
  checkTransactionStatus: _checkTransactionStatus,
}: UseLiquidityTransactionProps) {
  const createLiquidityMutation = useCreateLiquidityTransaction();

  const executeTransaction = useCallback(
    async (params: TransactionParams) => {
      const {
        tokenAAmount,
        tokenBAmount,
        tokenAAddress,
        tokenBAddress,
        slippage,
        publicKey,
        poolDetails,
      } = params;

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

      try {
        const response =
          await client.liquidity.createLiquidityTransaction(requestPayload);

        if (!response.success || !response.transaction) {
          throw new Error("Failed to create liquidity transaction");
        }

        _onSuccess(response.transaction);
        return response.transaction;
      } catch (error) {
        const contextualError =
          error instanceof Error ? error : new Error(String(error));
        _onError(contextualError, {
          amountA: tokenAAmount,
          amountB: tokenBAmount,
          tokenA: tokenAAddress,
          tokenB: tokenBAddress,
        });
        throw contextualError;
      }
    },
    [_onSuccess, _onError],
  );

  return {
    error: createLiquidityMutation.error,
    executeTransaction,
    isError: createLiquidityMutation.isError,
    isPending: createLiquidityMutation.isPending,
  };
}
