"use client";

import { client } from "@dex-web/orpc";
import type {
  CreateLiquidityTransactionInput,
  CreateLiquidityTransactionOutput,
  GetUserLiquidityOutput,
  RemoveLiquidityTransactionInput,
  RemoveLiquidityTransactionOutput,
  SubmitLiquidityTransactionInput,
  SubmitLiquidityTransactionOutput,
  SubmitWithdrawalInput,
  SubmitWithdrawalOutput,
} from "@dex-web/orpc/schemas";
import type {
  WithdrawLiquidityInput,
  WithdrawLiquidityOutput,
} from "@dex-web/orpc/schemas/liquidity/withdrawLiquidity.schema";
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

export function useCreateLiquidityTransaction(): UseMutationResult<
  CreateLiquidityTransactionOutput,
  unknown,
  CreateLiquidityTransactionInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: CreateLiquidityTransactionInput) =>
      client.liquidity.createLiquidityTransaction(variables),
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to create liquidity transaction");
    },
    onSuccess: (
      _data: CreateLiquidityTransactionOutput,
      variables: CreateLiquidityTransactionInput,
    ) => {
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

export function useSubmitLiquidityTransaction(): UseMutationResult<
  SubmitLiquidityTransactionOutput,
  unknown,
  SubmitLiquidityTransactionInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: SubmitLiquidityTransactionInput) =>
      client.liquidity.submitLiquidityTransaction(variables),
    onError: (error: unknown) => {
      handleMutationError(error, "Failed to submit liquidity transaction");
    },
    onSuccess: (
      _data: SubmitLiquidityTransactionOutput,
      _variables: SubmitLiquidityTransactionInput,
    ) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.liquidity.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.pools.all });
      handleMutationSuccess("Liquidity transaction submitted successfully");
    },
  });
}

export function useWithdrawLiquidity(): UseMutationResult<
  WithdrawLiquidityOutput,
  unknown,
  WithdrawLiquidityInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: WithdrawLiquidityInput) =>
      client.liquidity.withdrawLiquidity(variables),
    onError: (error: unknown, variables: WithdrawLiquidityInput) => {
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
    onSuccess: (
      _data: WithdrawLiquidityOutput,
      variables: WithdrawLiquidityInput,
    ) => {
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

export function useRemoveLiquidityTransaction(): UseMutationResult<
  RemoveLiquidityTransactionOutput,
  unknown,
  RemoveLiquidityTransactionInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: RemoveLiquidityTransactionInput) =>
      client.liquidity.removeLiquidityTransaction(variables),
    onError: (error: unknown) => {
      handleMutationError(
        error,
        "Failed to create liquidity removal transaction",
      );
    },
    onSuccess: (
      _data: RemoveLiquidityTransactionOutput,
      _variables: RemoveLiquidityTransactionInput,
    ) => {
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
  unknown,
  SubmitWithdrawalInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: SubmitWithdrawalInput) =>
      client.liquidity.submitWithdrawal(variables),
    onError: (
      error: unknown,
      variables: SubmitWithdrawalInput,
      context?: { previousLiquidity?: GetUserLiquidityOutput },
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

      const previousLiquidity =
        queryClient.getQueryData<GetUserLiquidityOutput>(userLiquidityKey);

      if (previousLiquidity) {
        const currentLiquidity = previousLiquidity;
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
    onSuccess: (
      _data: SubmitWithdrawalOutput,
      variables: SubmitWithdrawalInput,
    ) => {
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
