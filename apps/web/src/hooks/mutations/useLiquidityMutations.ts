"use client";

import { client } from "@dex-web/orpc";
import type {
  SubmitWithdrawalInput,
  SubmitWithdrawalOutput,
} from "@dex-web/orpc/schemas/liquidity/submitWithdrawal.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  handleMutationError,
  handleMutationSuccess,
} from "../../lib/mutationUtils";
import { queryKeys } from "../../lib/queryKeys";

export function useSubmitWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation<SubmitWithdrawalOutput, unknown, SubmitWithdrawalInput>({
    mutationFn: (variables: SubmitWithdrawalInput) =>
      client.liquidity.submitWithdrawal(variables),
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to submit withdrawal");
    },
    onSuccess: (
      _data: SubmitWithdrawalOutput,
      variables: SubmitWithdrawalInput,
    ) => {
      // Invalidate liquidity queries for the specific user and token pair
      queryClient.invalidateQueries({
        queryKey: queryKeys.liquidity.user(
          variables.ownerAddress,
          variables.tokenXMint,
          variables.tokenYMint,
        ),
      });
      // Invalidate all liquidity queries
      queryClient.invalidateQueries({ queryKey: queryKeys.liquidity.all });
      // Invalidate pool queries since reserves changed
      queryClient.invalidateQueries({ queryKey: queryKeys.pools.all });
      // Invalidate specific pool reserves
      queryClient.invalidateQueries({
        queryKey: queryKeys.pools.reserves(
          variables.tokenXMint,
          variables.tokenYMint,
        ),
      });
      // Invalidate token accounts since balances changed
      queryClient.invalidateQueries({
        queryKey: queryKeys.tokens.accounts(variables.ownerAddress),
      });
      handleMutationSuccess("Withdrawal submitted successfully");
    },
  });
}
