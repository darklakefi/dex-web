import { Box, Hero, Text } from "@dex-web/ui";
import type { SearchParams } from "nuqs/server";
import { FeaturesAndTrendingPoolPanel } from "../../_components/FeaturesAndTrendingPoolPanel";
import { LIQUIDITY_PAGE_TYPE } from "../../_utils/constants";
import { liquidityPageCache } from "../../_utils/searchParams";
import { LazyLiquidityForm } from "../../_components/LazyLiquidityForm";
import { LazyCreatePoolForm } from "./_components/LazyCreatePoolForm";
import { LazyYourLiquidity } from "./_components/LazyYourLiquidity";

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const parsedSearchParams = await liquidityPageCache.parse(searchParams);

  const isCreatePoolMode =
    parsedSearchParams.type === LIQUIDITY_PAGE_TYPE.CREATE_POOL;

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
        {isCreatePoolMode ? <LazyCreatePoolForm /> : <LazyLiquidityForm />}
        <LazyYourLiquidity
          tokenAAddress={parsedSearchParams.tokenAAddress}
          tokenBAddress={parsedSearchParams.tokenBAddress}
        />
      </div>
      <div className="hidden max-w-xs md:block">
        <FeaturesAndTrendingPoolPanel />
      </div>
    </div>
  );
}
