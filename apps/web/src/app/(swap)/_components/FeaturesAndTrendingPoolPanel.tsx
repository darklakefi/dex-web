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
        icon="crown"
        pools={featuredPools}
        title="Featured Pools"
      />
      <ShortPoolPanel
        icon="fire"
        pools={trendingPools}
        title="Trending Pools"
      />
      <Button className="w-fit" text="explore all pools" variant="tertiary" />
    </div>
  );
}
