"use client";

import { tanstackClient } from "@dex-web/orpc";
import type { GetAllUserLiquidityOutput } from "@dex-web/orpc/schemas/index";
import {
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";

interface AllUserLiquidityQueryOptions
  extends Pick<UseQueryOptions<GetAllUserLiquidityOutput>, "enabled"> {}

export function useAllUserLiquidity(
  ownerAddress: string,
  options?: AllUserLiquidityQueryOptions,
): UseQueryResult<GetAllUserLiquidityOutput> {
  return useQuery({
    ...tanstackClient.liquidity.getAllUserLiquidity.queryOptions({
      input: { ownerAddress },
      ...options,
    }),
    queryKey: queryKeys.liquidity.allUserPositions(ownerAddress),
  });
}
