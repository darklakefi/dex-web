import { Box, Hero, Text } from "@dex-web/ui";
import { QueryClient } from "@tanstack/react-query";
import type { SearchParams } from "nuqs/server";
import { tanstackClient } from "../../../../../../libs/orpc/src/client";
import { FeaturesAndTrendingPoolPanel } from "../../_components/FeaturesAndTrendingPoolPanel";
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
            <LiquidityForm />
            <YourLiquidity
              tokenAAddress={parsedSearchParams.tokenAAddress}
              tokenBAddress={parsedSearchParams.tokenBAddress}
            />
          </>
        )}
        {parsedSearchParams.type === LIQUIDITY_PAGE_TYPE.CREATE_POOL && (
          <CreatePoolForm />
        )}
      </div>
      <div className="hidden max-w-xs md:block">
        <FeaturesAndTrendingPoolPanel />
      </div>
    </div>
  );
}
