import { tanstackClient } from "@dex-web/orpc";
import { Box, Hero, Text } from "@dex-web/ui";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import type { SearchParams } from "nuqs/server";
import { SwapDetails } from "./_components/SwapDetails";
import { SwapFormFieldsets } from "./_components/SwapFormFieldsets";
import { SwapPageRefreshButton } from "./_components/SwapPageRefreshButton";
import { MOCK_OWNER_ADDRESS } from "./_utils/constants";
import { selectedTokensCache } from "./_utils/searchParams";
import { refreshSwapDetails } from "./actions";

const MOCK_SOLANA_ADDRESS = "11111111111111111111111111111111";
const MOCK_SWAP_ID = "1";

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
      tanstackClient.getTokenDetails.queryOptions({
        input: { address: MOCK_SOLANA_ADDRESS },
      }),
    ),

    queryClient.prefetchQuery(
      tanstackClient.helius.getTokenBalance.queryOptions({
        input: { ownerAddress: MOCK_OWNER_ADDRESS },
      }),
    ),
  ]);

  return (
    <div className="flex flex-col items-center justify-center">
      <Hero
        className="gap-4"
        image="/images/waddles/pose4.png"
        imagePosition="end"
      >
        <div className="flex flex-col gap-3 uppercase">
          <Text.Heading>swap</Text.Heading>
          <div className="flex flex-col">
            <Text.Body2>ANTI-SANDWICH DEFENSE:</Text.Body2>
            <Text.Body2 className="text-green-300">
              Value preservation system active.
            </Text.Body2>
          </div>
        </div>
      </Hero>
      <section className="flex w-full max-w-xl items-start gap-1">
        <div className="size-9" />
        <Box padding="lg">
          <SwapFormFieldsets />
          <HydrationBoundary state={dehydrate(queryClient)}>
            <SwapDetails />
          </HydrationBoundary>
        </Box>
        <SwapPageRefreshButton handleRefresh={refreshSwapDetails} />
      </section>
    </div>
  );
}
