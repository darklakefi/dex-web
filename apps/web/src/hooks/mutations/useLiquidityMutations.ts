"use client";

import { client } from "@dex-web/orpc";
import type {
  SubmitWithdrawalInput,
  SubmitWithdrawalOutput,
} from "@dex-web/orpc/schemas/liquidity/submitWithdrawal.schema";
import {
  type UseMutationResult,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import Decimal from "decimal.js";
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
    onError: (error: unknown, variables: any) => {
      const userLiquidityKey = queryKeys.liquidity.user(
        variables.ownerAddress,
        variables.tokenXMint,
        variables.tokenYMint,
      );
      queryClient.invalidateQueries({
        exact: true,
        queryKey: userLiquidityKey,
      });
      handleMutationError(error, "Failed to withdraw liquidity");
    },
    onSuccess: (_data: unknown, variables: any) => {
      const userLiquidityKey = queryKeys.liquidity.user(
        variables.ownerAddress,
        variables.tokenXMint,
        variables.tokenYMint,
      );
      const poolReservesKey = queryKeys.pools.reserves(
        variables.tokenXMint,
        variables.tokenYMint,
      );

      queryClient.invalidateQueries({
        exact: true,
        queryKey: userLiquidityKey,
      });
      queryClient.invalidateQueries({
        exact: true,
        queryKey: poolReservesKey,
      });
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

export function useSubmitWithdrawal(): UseMutationResult<
  SubmitWithdrawalOutput,
  Error,
  SubmitWithdrawalInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: SubmitWithdrawalInput) =>
      client.liquidity.submitWithdrawal(variables),
    onError: (
      error: unknown,
      variables: SubmitWithdrawalInput,
      context: any,
    ) => {
      const userLiquidityKey = queryKeys.liquidity.user(
        variables.ownerAddress,
        variables.tokenXMint,
        variables.tokenYMint,
      );

      if (context?.previousLiquidity) {
        queryClient.setQueryData(userLiquidityKey, context.previousLiquidity);
      }

      handleMutationError(error, "Failed to submit withdrawal");
    },
    onMutate: async (variables: SubmitWithdrawalInput) => {
      const userLiquidityKey = queryKeys.liquidity.user(
        variables.ownerAddress,
        variables.tokenXMint,
        variables.tokenYMint,
      );

      await queryClient.cancelQueries({ queryKey: userLiquidityKey });

      const previousLiquidity = queryClient.getQueryData(userLiquidityKey);

      if (
        previousLiquidity &&
        typeof previousLiquidity === "object" &&
        "hasLiquidity" in previousLiquidity
      ) {
        const currentLiquidity = previousLiquidity as any;
        if (currentLiquidity.hasLiquidity) {
          const withdrawnAmount = new Decimal(variables.lpTokenAmount)
            .mul(new Decimal(10).pow(currentLiquidity.decimals))
            .toNumber();
          const newBalance = Math.max(
            0,
            currentLiquidity.lpTokenBalance - withdrawnAmount,
          );

          const optimisticLiquidity = {
            ...currentLiquidity,
            hasLiquidity: newBalance > 0,
            lpTokenBalance: newBalance,
          };

          queryClient.setQueryData(userLiquidityKey, optimisticLiquidity);
        }
      }

      return { previousLiquidity };
    },
    onSuccess: (_data: unknown, variables: any) => {
      const userLiquidityKey = queryKeys.liquidity.user(
        variables.ownerAddress,
        variables.tokenXMint,
        variables.tokenYMint,
      );
      const poolReservesKey = queryKeys.pools.reserves(
        variables.tokenXMint,
        variables.tokenYMint,
      );

      setTimeout(() => {
        queryClient.invalidateQueries({
          exact: true,
          queryKey: userLiquidityKey,
        });
        queryClient.invalidateQueries({
          exact: true,
          queryKey: poolReservesKey,
        });
      }, 2000);

      handleMutationSuccess("Withdrawal submitted successfully");
    },
  });
}
