"use server";

import { MAINNET_POOLS, MOCK_POOLS } from "../../mocks/pool.mock";
import type { GetPinedPoolOutput } from "../../schemas/pools/getPinedPool.schema";

export async function getPinedPoolHandler(): Promise<GetPinedPoolOutput> {
  const localDataPool =
    process.env.NETWORK === "2" ? MOCK_POOLS : MAINNET_POOLS;

  return {
    featuredPools: localDataPool,
    trendingPools: [],
  };
}
