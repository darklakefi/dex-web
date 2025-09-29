import { tanstackClient } from "@dex-web/orpc";
import { Box, Hero, Text } from "@dex-web/ui";
import { QueryClient } from "@tanstack/react-query";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { FeaturesAndTrendingPoolPanel } from "../../_components/FeaturesAndTrendingPoolPanel";
import { SkeletonLoader } from "../../_components/SkeletonLoader";
import { selectedTokensCache } from "../../_utils/searchParams";
import { SwapForm } from "./_components/SwapForm";
import { SwapTransactionHistory } from "./_components/SwapTransactionHistory";

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await selectedTokensCache.parse(searchParams);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery(
    tanstackClient.pools.getPinedPool.queryOptions({}),
  );

  return (
    <div className="flex justify-center gap-12">
      <div className="flex w-full max-w-xl flex-col items-center justify-center">
        <section className="hidden w-full items-start gap-1 md:flex">
          <div className="size-9" />
          <Box className="mb-0 bg-green-800 pb-0">
            <Hero
              className="gap-4"
              image="/images/waddles/pose4.png"
              imageClassName="scale-x-[-1] "
              imagePosition="end"
            >
              <div className="flex flex-col gap-3 uppercase">
                <Text.Heading>swap</Text.Heading>
                <div className="flex flex-col text-md">
                  <Text.Body2 className="text-md md:text-lg">
                    MEV attacks intercepted:
                  </Text.Body2>
                  <Text.Body2 className="text-green-300 text-md md:text-lg">
                    better prices.
                  </Text.Body2>
                </div>
              </div>
            </Hero>
          </Box>
          <div className="size-9" />
        </section>
        <Suspense fallback={
          <Box className="w-full max-w-md animate-pulse">
            <SkeletonLoader variant="text" className="mb-4 h-8 w-32" />
            <div className="space-y-4">
              <SkeletonLoader variant="input" className="h-20 w-full" />
              <SkeletonLoader variant="input" className="h-20 w-full" />
              <SkeletonLoader variant="button" className="h-12 w-full" />
            </div>
          </Box>
        }>
          <SwapForm />
        </Suspense>
        <Suspense fallback={
          <Box className="mt-6 w-full max-w-md animate-pulse">
            <SkeletonLoader variant="text" className="mb-3 h-6 w-40" />
            <div className="space-y-2">
              <SkeletonLoader variant="text" className="h-4 w-full" />
              <SkeletonLoader variant="text" className="h-4 w-3/4" />
              <SkeletonLoader variant="text" className="h-4 w-5/6" />
            </div>
          </Box>
        }>
          <SwapTransactionHistory />
        </Suspense>
      </div>
      <div className="hidden max-w-xs md:block">
        <FeaturesAndTrendingPoolPanel />
      </div>
    </div>
  );
}
