import { Box, Hero, Text } from "@dex-web/ui";
import { sortSolanaAddresses } from "@dex-web/utils";
import { QueryClient } from "@tanstack/react-query";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { tanstackClient } from "../../../../../../libs/orpc/src/client";
import { FeaturesAndTrendingPoolPanel } from "../../_components/FeaturesAndTrendingPoolPanel";
import { SkeletonLoader } from "../../_components/SkeletonLoader";
import { LIQUIDITY_PAGE_TYPE } from "../../_utils/constants";
import { liquidityPageCache } from "../../_utils/searchParams";
import { CreatePoolForm } from "./_components/CreatePoolForm";
import { LiquidityForm } from "./_components/LiquidityForm";
import { YourLiquidity } from "./_components/YourLiquidity";

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const parsedSearchParams = await liquidityPageCache.parse(searchParams);

  const queryClient = new QueryClient();

  const prefetchPromises = [
    queryClient.prefetchQuery(
      tanstackClient.pools.getPinedPool.queryOptions({}),
    ),
    queryClient.prefetchQuery({
      queryFn: () => null,
      queryKey: ["wallet", "adapter"],
      staleTime: 30 * 60 * 1000,
    }),
  ];

  if (parsedSearchParams.tokenAAddress && parsedSearchParams.tokenBAddress) {
    try {
      const sortedTokens = sortSolanaAddresses(
        parsedSearchParams.tokenAAddress,
        parsedSearchParams.tokenBAddress,
      );

      prefetchPromises.push(
        queryClient.prefetchQuery(
          tanstackClient.pools.getPoolDetails.queryOptions({
            input: {
              tokenXMint: sortedTokens.tokenXAddress,
              tokenYMint: sortedTokens.tokenYAddress,
            },
          }),
        ),
      );
    } catch (error) {
      console.warn("Invalid token addresses for prefetch:", error);
    }
  }

  await Promise.all(prefetchPromises);

  return (
    <div className="flex justify-center gap-12">
      <div className="flex w-full max-w-xl flex-col items-center justify-center">
        <section className="hidden w-full items-start gap-1 md:flex">
          <div className="size-9" />
          <Box className="mb-0 bg-green-800 pb-0">
            <Hero
              className="gap-4"
              image="/images/waddles/pose4.png"
              imageClassName="scale-x-[-1]"
              imagePosition="end"
            >
              <div className="flex flex-col gap-3 uppercase">
                <Text.Heading>liquidity</Text.Heading>
                <div className="flex flex-col text-md">
                  <Text.Body2 className="text-md md:text-lg">
                    MEV profits recovered:
                  </Text.Body2>
                  <Text.Body2 className="text-green-300 text-md md:text-lg">
                    Higher yields.
                  </Text.Body2>
                </div>
              </div>
            </Hero>
          </Box>
          <div className="size-9" />
        </section>
        {parsedSearchParams.type === LIQUIDITY_PAGE_TYPE.ADD_LIQUIDITY && (
          <>
            <Suspense
              fallback={
                <Box className="w-full max-w-md animate-pulse">
                  <SkeletonLoader className="mb-4 h-8 w-48" variant="text" />
                  <div className="space-y-4">
                    <SkeletonLoader className="h-20 w-full" variant="input" />
                    <SkeletonLoader className="h-20 w-full" variant="input" />
                    <SkeletonLoader className="h-12 w-full" variant="button" />
                  </div>
                </Box>
              }
            >
              <LiquidityForm />
            </Suspense>
            <Suspense
              fallback={
                <Box className="mt-4 w-full max-w-md animate-pulse">
                  <SkeletonLoader className="mb-3 h-6 w-32" variant="text" />
                  <div className="space-y-3">
                    <SkeletonLoader className="h-4 w-40" variant="balance" />
                    <SkeletonLoader className="h-4 w-36" variant="balance" />
                    <SkeletonLoader className="h-10 w-full" variant="button" />
                  </div>
                </Box>
              }
            >
              <YourLiquidity
                tokenAAddress={parsedSearchParams.tokenAAddress}
                tokenBAddress={parsedSearchParams.tokenBAddress}
              />
            </Suspense>
          </>
        )}
        {parsedSearchParams.type === LIQUIDITY_PAGE_TYPE.CREATE_POOL && (
          <Suspense
            fallback={
              <Box className="w-full max-w-md animate-pulse">
                <SkeletonLoader className="mb-4 h-8 w-48" variant="text" />
                <div className="space-y-4">
                  <SkeletonLoader className="h-20 w-full" variant="input" />
                  <SkeletonLoader className="h-20 w-full" variant="input" />
                  <SkeletonLoader className="h-16 w-full" variant="input" />
                  <SkeletonLoader className="h-12 w-full" variant="button" />
                </div>
              </Box>
            }
          >
            <CreatePoolForm />
          </Suspense>
        )}
      </div>
      <div className="hidden max-w-xs md:block">
        <FeaturesAndTrendingPoolPanel />
      </div>
    </div>
  );
}
