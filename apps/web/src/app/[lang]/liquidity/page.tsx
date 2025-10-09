import { client } from "@dex-web/orpc";
import { Box, Hero, Text } from "@dex-web/ui";
import { sortSolanaAddresses } from "@dex-web/utils";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import type { PoolData } from "apps/web/src/hooks/usePoolData";
import { queryKeys } from "apps/web/src/lib/queryKeys";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { FeaturesAndTrendingPoolPanel } from "../../_components/FeaturesAndTrendingPoolPanel";
import { SkeletonForm } from "../../_components/SkeletonForm";
import { liquidityPageCache } from "../../_utils/searchParams";
import { GlobalLoadingIndicator } from "./_components/GlobalLoadingIndicator";
import { LiquidityForm } from "./_components/LiquidityForm";
import { YourLiquidity } from "./_components/YourLiquidity";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const parsedSearchParams = await liquidityPageCache.parse(searchParams);

  const queryClient = new QueryClient();
  const { tokenAAddress, tokenBAddress } = parsedSearchParams;

  if (tokenAAddress && tokenBAddress) {
    try {
      const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
        tokenAAddress,
        tokenBAddress,
      );

      await queryClient.prefetchQuery({
        queryFn: async (): Promise<PoolData | null> => {
          const result = await client.pools.getPoolReserves({
            tokenXMint: tokenXAddress,
            tokenYMint: tokenYAddress,
          });

          if (!result || !result.exists) {
            return null;
          }

          return {
            exists: result.exists,
            lastUpdate: Date.now(),
            lpMint: result.lpMint,
            reserveX: result.reserveX,
            reserveY: result.reserveY,
            tokenXMint: tokenXAddress,
            tokenYMint: tokenYAddress,
            totalLpSupply: result.totalLpSupply,
          };
        },
        queryKey: queryKeys.pools.reserves(tokenXAddress, tokenYAddress),
      });
    } catch (error) {
      console.error("Failed to prefetch pool reserves", error);
    }
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <>
      <GlobalLoadingIndicator />
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
          <HydrationBoundary state={dehydratedState}>
            <Suspense fallback={<SkeletonForm type="liquidity" />}>
              <LiquidityForm />
            </Suspense>
          </HydrationBoundary>
          <YourLiquidity
            tokenAAddress={parsedSearchParams.tokenAAddress}
            tokenBAddress={parsedSearchParams.tokenBAddress}
          />
        </div>
        <div className="hidden max-w-xs md:block">
          <FeaturesAndTrendingPoolPanel />
        </div>
      </div>
    </>
  );
}
