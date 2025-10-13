"use client";

import { client } from "@dex-web/orpc";
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
 * - Mutation handles its own query invalidations in onSuccess
 * - Invalidates all related queries (pools, liquidity, token accounts)
 * - Uses refetchType: "active" to only refetch mounted queries
 *
 * This mutation is called after the user signs the transaction.
 * The onSuccess callback ensures all UI data is refreshed after blockchain confirmation.
 */
export function useSubmitAddLiquidity() {
  const queryClient = useQueryClient();

  return useMutation<
    SubmitAddLiquidityOutput,
    unknown,
    SubmitAddLiquidityInput
  >({
    mutationFn: (variables: SubmitAddLiquidityInput) =>
      client.liquidity.submitAddLiquidity(variables),
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to submit add liquidity transaction");
    },
    onSuccess: async (
      _data: SubmitAddLiquidityOutput,
      variables: SubmitAddLiquidityInput,
    ) => {
      // Invalidate liquidity-related queries for the specific pool and tokens
      await invalidateLiquidityData(queryClient, {
        ownerAddress: variables.userAddress,
        tokenXMint: variables.tokenXMint,
        tokenYMint: variables.tokenYMint,
      });
    },
  });
}
