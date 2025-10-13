"use client";

import { client } from "@dex-web/orpc";
import type {
  SubmitWithdrawalInput,
  SubmitWithdrawalOutput,
} from "@dex-web/orpc/schemas/liquidity/submitWithdrawal.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "../../lib/mutationUtils";
import { invalidateLiquidityData } from "../../lib/query/invalidations";

/**
 * Mutation hook for submitting withdrawal (remove liquidity) transactions.
 *
 * Following TanStack Query best practices:
 * - Mutation handles its own query invalidations in onSuccess
 * - Invalidates all related queries (pools, liquidity, token accounts)
 * - Uses refetchType: "active" to only refetch mounted queries
 *
 * This mutation is called after the user signs the withdrawal transaction.
 * The onSuccess callback ensures all UI data is refreshed after blockchain confirmation.
 */
export function useSubmitWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation<SubmitWithdrawalOutput, unknown, SubmitWithdrawalInput>({
    mutationFn: (variables: SubmitWithdrawalInput) =>
      client.liquidity.submitWithdrawal(variables),
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to submit withdrawal");
    },
    onSuccess: async (
      _data: SubmitWithdrawalOutput,
      variables: SubmitWithdrawalInput,
    ) => {
      await invalidateLiquidityData(queryClient, {
        ownerAddress: variables.ownerAddress,
      });
    },
  });
}
