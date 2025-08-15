"use client";

import type { Pool } from "@dex-web/core";
import { tanstackClient } from "@dex-web/orpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { selectedTokensParsers } from "../_utils/searchParams";
import { ShortPoolPanel } from "../[lang]/(swap)/_components/ShortPoolPanel";

export function FeaturesAndTrendingPoolPanel() {
  const { data } = useSuspenseQuery(
    tanstackClient.pools.getPinedPool.queryOptions({}),
  );
  const [_, setSelectedTokens] = useQueryStates(selectedTokensParsers);

  const onPoolClick = (pool: Pool) => {
    setSelectedTokens({
      tokenAAddress: pool.tokenXMint,
      tokenBAddress: pool.tokenYMint,
    });
  };

  return (
    <div className="flex w-full min-w-xs flex-col items-center gap-10 bg-transparent">
      {data.featuredPools.length > 0 && (
        <ShortPoolPanel
          icon="crown"
          onPoolClick={onPoolClick}
          pools={data.featuredPools}
          title="Featured Pools"
        />
      )}
      {data.trendingPools.length > 0 && (
        <ShortPoolPanel
          icon="fire"
          onPoolClick={onPoolClick}
          pools={data.trendingPools}
          title="Trending Pools"
        />
      )}
      {/* <Button className="w-fit" text="explore all pools" variant="tertiary" /> */}
    </div>
  );
}
