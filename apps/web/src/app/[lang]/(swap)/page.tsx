import { tanstackClient } from "@dex-web/orpc";
import { Box, Hero, Text } from "@dex-web/ui";
import { QueryClient } from "@tanstack/react-query";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { FeaturesAndTrendingPoolPanel } from "../../_components/FeaturesAndTrendingPoolPanel";
import { SkeletonLoader } from "../../_components/SkeletonLoader";
import { selectedTokensCache } from "../../_utils/searchParams";
import { LazySwapForm } from "../../_components/LazySwapForm";
import { LazySwapTransactionHistory } from "./_components/LazySwapTransactionHistory";

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await selectedTokensCache.parse(searchParams);

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
        <LazySwapForm />
        <LazySwapTransactionHistory />
      </div>
      <div className="hidden max-w-xs md:block">
        <FeaturesAndTrendingPoolPanel />
      </div>
    </div>
  );
}
