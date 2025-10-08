"use client";

import type { SendSignedTransactionRequest } from "@dex-web/grpc-client";
import { client } from "@dex-web/orpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  handleMutationError,
  handleMutationSuccess,
} from "../../lib/mutationUtils";
import { queryKeys } from "../../lib/queryKeys";

export function useSubmitSignedTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: SendSignedTransactionRequest) =>
      client.dexGateway.submitSignedTransaction(variables),
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to submit transaction");
    },
    onSuccess: (_data: unknown, _variables: SendSignedTransactionRequest) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pools.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      handleMutationSuccess("Transaction submitted successfully");
    },
  });
}
