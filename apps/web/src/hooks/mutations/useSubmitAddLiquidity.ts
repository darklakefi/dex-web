"use client";
import { client, tanstackClient } from "@dex-web/orpc";
import type {
  SubmitAddLiquidityInput,
  SubmitAddLiquidityOutput,
} from "@dex-web/orpc/schemas/liquidity/submitAddLiquidity.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "../../lib/mutationUtils";
import { invalidateLiquidityData } from "../../lib/query/invalidations";

/**
 * Mutation hook for submitting signed add liquidity transactions to the blockchain.
 *
 * Following TanStack Query best practices:
 * - Uses optimistic updates for instant UI feedback
 * - Mutation handles its own query invalidations in onSuccess
 * - Invalidates all related queries (pools, liquidity, token accounts)
 * - Rolls back optimistic updates on error
 *
 * This mutation is called after the user signs the transaction.
 * The optimistic update immediately shows the new liquidity in the UI,
 * then the onSuccess callback ensures data is refreshed from the server.
 */
export interface MutationContext {
  previousLiquidity: unknown;
}

export function useSubmitAddLiquidity() {
  const queryClient = useQueryClient();

  return useMutation<
    SubmitAddLiquidityOutput,
    unknown,
    SubmitAddLiquidityInput & { lpTokenAmount?: bigint },
    MutationContext
  >({
    mutationFn: (
      variables: SubmitAddLiquidityInput & { lpTokenAmount?: bigint },
    ) =>
      client.liquidity.submitAddLiquidity({
        signedTransaction: variables.signedTransaction,
        tokenXMint: variables.tokenXMint,
        tokenYMint: variables.tokenYMint,
        userAddress: variables.userAddress,
      }),

    onError: (
      error: unknown,
      variables: SubmitAddLiquidityInput & { lpTokenAmount?: bigint },
      context,
    ) => {
      handleMutationError(error, "Failed to submit add liquidity transaction");

      if (context?.previousLiquidity) {
        const liquidityQueryKey = tanstackClient.liquidity.getUserLiquidity.key(
          {
            input: {
              ownerAddress: variables.userAddress,
              tokenXMint: variables.tokenXMint,
              tokenYMint: variables.tokenYMint,
            },
          },
        );
        queryClient.setQueryData(liquidityQueryKey, context.previousLiquidity);
      }
    },

    onMutate: async (
      variables: SubmitAddLiquidityInput & { lpTokenAmount?: bigint },
    ) => {
      const liquidityQueryKey = tanstackClient.liquidity.getUserLiquidity.key({
        input: {
          ownerAddress: variables.userAddress,
          tokenXMint: variables.tokenXMint,
          tokenYMint: variables.tokenYMint,
        },
      });

      await queryClient.cancelQueries({ queryKey: liquidityQueryKey });

      const previousLiquidity = queryClient.getQueryData(liquidityQueryKey);

      queryClient.setQueryData(liquidityQueryKey, (old: unknown) => {
        if (!old || !variables.lpTokenAmount) return old;

        if (
          typeof old !== "object" ||
          !("lpTokenBalance" in old) ||
          !("hasLiquidity" in old)
        ) {
          return old;
        }

        const currentLpBalance = BigInt(
          (old.lpTokenBalance as string | undefined) || "0",
        );
        const addedLpTokens = variables.lpTokenAmount;
        const newLpBalance = currentLpBalance + addedLpTokens;

        return {
          ...old,
          hasLiquidity: true,
          lpTokenBalance: newLpBalance.toString(),
        };
      });

      return { previousLiquidity };
    },

    onSettled: async (
      _data,
      _error,
      variables: SubmitAddLiquidityInput & { lpTokenAmount?: bigint },
    ) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await invalidateLiquidityData(queryClient, {
        ownerAddress: variables.userAddress,
        tokenXMint: variables.tokenXMint,
        tokenYMint: variables.tokenYMint,
      });
    },
  });
}
