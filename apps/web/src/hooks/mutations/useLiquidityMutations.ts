"use client";

import { client } from "@dex-web/orpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  handleMutationError,
  handleMutationSuccess,
} from "../../lib/mutationUtils";
import { queryKeys } from "../../lib/queryKeys";

export function useCreateLiquidityTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: any) =>
      client.liquidity.createLiquidityTransaction(variables),
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to create liquidity transaction");
    },
    onSuccess: (_data: unknown, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.liquidity.user(
          variables.user,
          variables.tokenXMint,
          variables.tokenYMint,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pools.reserves(
          variables.tokenXMint,
          variables.tokenYMint,
        ),
      });
      handleMutationSuccess("Liquidity transaction created successfully");
    },
  });
}

export function useSubmitLiquidityTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: any) =>
      client.liquidity.submitLiquidityTransaction(variables),
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to submit liquidity transaction");
    },
    onSuccess: (_data: unknown, _variables: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.liquidity.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pools.all });
      handleMutationSuccess("Liquidity transaction submitted successfully");
    },
  });
}

export function useWithdrawLiquidity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: any) =>
      client.liquidity.withdrawLiquidity(variables),
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to withdraw liquidity");
    },
    onSuccess: (_data: unknown, _variables: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.liquidity.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pools.all });
      handleMutationSuccess("Liquidity withdrawn successfully");
    },
  });
}

export function useRemoveLiquidityTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: any) =>
      client.liquidity.removeLiquidityTransaction(variables),
    onError: (error: unknown) => {
      handleMutationError(
        error,
        "Failed to create liquidity removal transaction",
      );
    },
    onSuccess: (_data: unknown, _variables: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.liquidity.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pools.all });
      handleMutationSuccess(
        "Liquidity removal transaction created successfully",
      );
    },
  });
}

export function useSubmitWithdrawal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: any) =>
      client.liquidity.submitWithdrawal(variables),
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to submit withdrawal");
    },
    onSuccess: (_data: unknown, _variables: any) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.liquidity.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pools.all });
      handleMutationSuccess("Withdrawal submitted successfully");
    },
  });
}
