"use client";

import type { Pool } from "@dex-web/core";
import { useQueryStates } from "nuqs";
import { usePinnedPools } from "../../hooks/queries/usePoolQueries";
import { LIQUIDITY_PAGE_TYPE } from "../_utils/constants";
import { liquidityPageParsers } from "../_utils/searchParams";
import { ShortPoolPanel } from "../[lang]/(swap)/_components/ShortPoolPanel";

export function FeaturesAndTrendingPoolPanel() {
  const { data } = usePinnedPools();
  const [_, setSelectedTokens] = useQueryStates(liquidityPageParsers);

  const onPoolClick = (pool: Pool) => {
    setSelectedTokens({
      tokenAAddress: pool.tokenXMint,
      tokenBAddress: pool.tokenYMint,
      type: LIQUIDITY_PAGE_TYPE.ADD_LIQUIDITY,
    });
  };

  if (!data?.featuredPools && !data?.trendingPools) {
    return null;
  }

  return (
    <div className="flex w-full min-w-xs flex-col items-center gap-10 bg-transparent">
      {data?.featuredPools?.length > 0 && (
        <ShortPoolPanel
          icon="crown"
          onPoolClick={onPoolClick}
          pools={data.featuredPools}
          title="Featured Pools"
        />
      )}
      {data?.trendingPools?.length > 0 && (
        <ShortPoolPanel
          icon="fire"
          onPoolClick={onPoolClick}
          pools={data.trendingPools}
          title="Trending Pools"
        />
      )}
    </div>
  );
}
