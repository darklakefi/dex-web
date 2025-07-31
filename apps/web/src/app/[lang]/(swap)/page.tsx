import { tanstackClient } from "@dex-web/orpc";
import { Box, Hero, Text } from "@dex-web/ui";
import { QueryClient } from "@tanstack/react-query";
import type { SearchParams } from "nuqs/server";
import { SwapForm } from "./_components/SwapForm";
import { MOCK_OWNER_ADDRESS, MOCK_SWAP_ID } from "./_utils/constants";
import { selectedTokensCache } from "./_utils/searchParams";

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await selectedTokensCache.parse(searchParams);

  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery(
      tanstackClient.getSwapDetails.queryOptions({
        input: { swapId: MOCK_SWAP_ID },
      }),
    ),

    queryClient.prefetchQuery(
      tanstackClient.helius.getTokenAccounts.queryOptions({
        input: { ownerAddress: MOCK_OWNER_ADDRESS },
      }),
    ),
  ]);

  return (
    <div className="flex justify-center gap-12">
      <div className="flex max-w-xl flex-col items-center justify-center">
        <section className="flex w-full items-start gap-1">
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
                    ANTI-SANDWICH DEFENSE:
                  </Text.Body2>
                  <Text.Body2 className="text-green-300 text-md md:text-lg">
                    Value preservation system active.
                  </Text.Body2>
                </div>
              </div>
            </Hero>
          </Box>

          <div className="size-9" />
        </section>
        <SwapForm />
      </div>
      {/* <div className="max-w-xs">
        <FeaturesAndTrendingPoolPanel featuredPools={[]} trendingPools={[]} />
      </div> */}
    </div>
  );
}
