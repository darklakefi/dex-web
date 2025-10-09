"use client";

import { client } from "@dex-web/orpc";
import type {
  SubmitWithdrawalInput,
  SubmitWithdrawalOutput,
} from "@dex-web/orpc/schemas/liquidity/submitWithdrawal.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "../../lib/mutationUtils";
import { queryKeys } from "../../lib/queryKeys";

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
      await new Promise((resolve) => setTimeout(resolve, 1000));

      queryClient.invalidateQueries({
        queryKey: queryKeys.liquidity.user(
          variables.ownerAddress,
          variables.tokenXMint,
          variables.tokenYMint,
        ),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.liquidity.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pools.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pools.reserves(
          variables.tokenXMint,
          variables.tokenYMint,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tokens.accounts(variables.ownerAddress),
      });
    },
  });
}
