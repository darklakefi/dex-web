import type { Pool } from "@dex-web/core";
import { Button } from "@dex-web/ui";
import { ShortPoolPanel } from "./ShortPoolPanel";

interface FeaturedAndTrendingPoolPanelProps {
  featuredPools: Pool[];
  trendingPools: Pool[];
}

export function FeaturedAndTrendingPoolPanel({
  featuredPools,
  trendingPools,
}: FeaturedAndTrendingPoolPanelProps) {
  return (
    <div className="flex w-full flex-col items-center gap-10 bg-transparent">
      <ShortPoolPanel
        pools={featuredPools}
        title="Featured Pools"
        icon="crown"
      />
      <ShortPoolPanel
        pools={trendingPools}
        title="Trending Pools"
        icon="fire"
      />
      <Button.Tertiary text="explore all pools" className="w-fit" />
    </div>
  );
}
