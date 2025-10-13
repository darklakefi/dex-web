import { tanstackClient } from "@dex-web/orpc";
import { Box, Hero, Text } from "@dex-web/ui";
import { sortSolanaAddresses } from "@dex-web/utils";
import { SwapTransactionHistory } from "apps/web/src/app/[lang]/(swap)/_components/SwapTransactionHistory";
import type { SearchParams } from "nuqs/server";
import { getQueryClient, HydrateClient } from "../../../lib/query/hydration";
import { queryKeys } from "../../../lib/queryKeys";
import { FeaturesAndTrendingPoolPanel } from "../../_components/FeaturesAndTrendingPoolPanel";
import { selectedTokensCache } from "../../_utils/searchParams";
import { SwapForm } from "./_components/SwapForm";

export const metadata = {
  alternates: {
    canonical: "/",
  },
  description:
    "MEV-protected token swaps on Solana. Trade with better prices and protection from front-running attacks.",
  title: "Swap | Darklake",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await selectedTokensCache.parse(searchParams);
  const queryClient = getQueryClient();

  const { tokenXAddress: sortedTokenXMint, tokenYAddress: sortedTokenYMint } =
    params.tokenAAddress && params.tokenBAddress
      ? sortSolanaAddresses(params.tokenAAddress, params.tokenBAddress)
      : { tokenXAddress: "", tokenYAddress: "" };

  await Promise.allSettled([
    params.tokenAAddress && params.tokenBAddress
      ? queryClient.prefetchQuery(
          tanstackClient.pools.getPoolDetails.queryOptions({
            input: {
              tokenXMint: sortedTokenXMint,
              tokenYMint: sortedTokenYMint,
            },
          }),
        )
      : null,

    queryClient.prefetchQuery(
      tanstackClient.pools.getPinedPool.queryOptions({}),
    ),

    queryClient.prefetchQuery({
      ...tanstackClient.pools.getAllPools.queryOptions({
        input: {
          includeEmpty: true,
        },
      }),
      gcTime: 10 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
    }),

    params.tokenAAddress
      ? queryClient.prefetchQuery({
          ...tanstackClient.tokens.getTokenPrice.queryOptions({
            input: {
              amount: 1,
              mint: params.tokenAAddress,
              quoteCurrency: "USD",
            },
          }),
          gcTime: 30 * 1000,
          queryKey: queryKeys.tokens.price(params.tokenAAddress),
          staleTime: 5 * 1000,
        })
      : null,

    params.tokenBAddress
      ? queryClient.prefetchQuery({
          ...tanstackClient.tokens.getTokenPrice.queryOptions({
            input: {
              amount: 1,
              mint: params.tokenBAddress,
              quoteCurrency: "USD",
            },
          }),
          gcTime: 30 * 1000,
          queryKey: queryKeys.tokens.price(params.tokenBAddress),
          staleTime: 5 * 1000,
        })
      : null,
  ]);

  return (
    <HydrateClient client={queryClient}>
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
          <SwapForm />
          <SwapTransactionHistory />
        </div>
        <div className="hidden max-w-xs md:block">
          <FeaturesAndTrendingPoolPanel />
        </div>
      </div>
    </HydrateClient>
  );
}
