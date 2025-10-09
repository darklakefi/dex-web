"use client";

import { client } from "@dex-web/orpc";
import type { GetPoolReservesOutput } from "@dex-web/orpc/schemas/index";
import type { GetUserLiquidityOutput } from "@dex-web/orpc/schemas/pools/getUserLiquidity.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";

export interface AddLiquidityVariables {
  tokenMintX: string;
  tokenMintY: string;
  maxAmountX: bigint;
  maxAmountY: bigint;
  amountLp: bigint;
  userAddress: string;
  label: string;
  refCode: string;
}

export interface AddLiquidityResponse {
  unsignedTransaction: string;
  tradeId?: string;
}

export interface AddLiquidityContext {
  previousUserLiquidity: GetUserLiquidityOutput | undefined;
  previousPoolReserves: GetPoolReservesOutput | undefined;
  userLiquidityQueryKey: readonly (string | number)[];
  poolReservesQueryKey: readonly (string | number)[];
}

export function useAddLiquidityMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    AddLiquidityResponse,
    Error,
    AddLiquidityVariables,
    AddLiquidityContext
  >({
    mutationFn: async (variables: AddLiquidityVariables) => {
      const response = await client.dexGateway.addLiquidity(variables);
      return response;
    },
    onError: (_error, _variables, context) => {
      // Rollback optimistic updates on error
      if (context) {
        if (context.previousUserLiquidity) {
          queryClient.setQueryData(
            context.userLiquidityQueryKey,
            context.previousUserLiquidity,
          );
        }
        if (context.previousPoolReserves) {
          queryClient.setQueryData(
            context.poolReservesQueryKey,
            context.previousPoolReserves,
          );
        }
      }
    },
    onMutate: async (variables) => {
      // Create query keys for the affected queries
      const userLiquidityQueryKey = queryKeys.liquidity.user(
        variables.userAddress,
        variables.tokenMintX,
        variables.tokenMintY,
      );
      const poolReservesQueryKey = queryKeys.pools.reserves(
        variables.tokenMintX,
        variables.tokenMintY,
      );

      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: userLiquidityQueryKey });
      await queryClient.cancelQueries({ queryKey: poolReservesQueryKey });

      // Snapshot the previous values
      const previousUserLiquidity =
        queryClient.getQueryData<GetUserLiquidityOutput>(userLiquidityQueryKey);
      const previousPoolReserves =
        queryClient.getQueryData<GetPoolReservesOutput>(poolReservesQueryKey);

      // Calculate LP tokens for optimistic update
      const maxAmountXNumber = Number(variables.maxAmountX);
      const maxAmountYNumber = Number(variables.maxAmountY);

      // Optimistically update user liquidity
      if (previousUserLiquidity) {
        const optimisticLiquidity: GetUserLiquidityOutput = {
          ...previousUserLiquidity,
          hasLiquidity: true,
          lpTokenBalance:
            previousUserLiquidity.lpTokenBalance + Number(variables.amountLp),
        };
        queryClient.setQueryData(userLiquidityQueryKey, optimisticLiquidity);
      } else {
        // First time adding liquidity
        const optimisticLiquidity: GetUserLiquidityOutput = {
          decimals: 6,
          hasLiquidity: true,
          lpTokenBalance: Number(variables.amountLp),
          lpTokenMint: variables.tokenMintX,
        };
        queryClient.setQueryData(userLiquidityQueryKey, optimisticLiquidity);
      }

      // Optimistically update pool reserves
      if (previousPoolReserves) {
        const optimisticPoolReserves: GetPoolReservesOutput = {
          ...previousPoolReserves,
          reserveX: previousPoolReserves.reserveX + maxAmountXNumber,
          reserveY: previousPoolReserves.reserveY + maxAmountYNumber,
          totalLpSupply:
            previousPoolReserves.totalLpSupply + Number(variables.amountLp),
        };
        queryClient.setQueryData(poolReservesQueryKey, optimisticPoolReserves);
      }

      // Return context for rollback
      return {
        poolReservesQueryKey,
        previousPoolReserves,
        previousUserLiquidity,
        userLiquidityQueryKey,
      };
    },
    onSettled: (_data, _error, variables) => {
      // Refetch to ensure we have the latest data from the server
      queryClient.invalidateQueries({
        queryKey: queryKeys.liquidity.user(
          variables.userAddress,
          variables.tokenMintX,
          variables.tokenMintY,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.pools.reserves(
          variables.tokenMintX,
          variables.tokenMintY,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tokens.accounts(variables.userAddress),
      });
    },
  });
}
