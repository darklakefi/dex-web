import { client, tanstackClient } from "@dex-web/orpc";
import { Box, Hero, Text } from "@dex-web/ui";
import { sortSolanaAddresses } from "@dex-web/utils";
import type { PoolData } from "apps/web/src/hooks/usePoolData";
import {
  getQueryClient,
  HydrateClient,
} from "apps/web/src/lib/query/hydration";
import { queryKeys } from "apps/web/src/lib/queryKeys";
import type { SearchParams } from "nuqs/server";
import { FeaturesAndTrendingPoolPanel } from "../../_components/FeaturesAndTrendingPoolPanel";
import { LIQUIDITY_PAGE_TYPE } from "../../_utils/constants";
import { liquidityPageCache } from "../../_utils/searchParams";
import { GlobalLoadingIndicator } from "./_components/GlobalLoadingIndicator";
import { LiquidityPageContent } from "./_components/LiquidityPageContent";

export const metadata = {
  description:
    "Provide liquidity on Darklake and earn MEV-protected yields. Higher returns through MEV profit recovery.",
  title: "Liquidity | Darklake",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const parsedSearchParams = await liquidityPageCache.parse(searchParams);

  const isCreatePoolMode =
    parsedSearchParams.type === LIQUIDITY_PAGE_TYPE.CREATE_POOL;

  const queryClient = getQueryClient();
  const { tokenAAddress, tokenBAddress } = parsedSearchParams;

  if (tokenAAddress && tokenBAddress && !isCreatePoolMode) {
    const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
      tokenAAddress,
      tokenBAddress,
    );

    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryFn: async (): Promise<PoolData | null> => {
          const result = await client.pools.getPoolReserves({
            tokenXMint: tokenXAddress,
            tokenYMint: tokenYAddress,
          });

          if (!result || !result.exists) {
            return null;
          }

          return result;
        },
        queryKey: queryKeys.pools.reserves(tokenXAddress, tokenYAddress),
      }),

      queryClient.prefetchQuery(
        tanstackClient.pools.getPoolDetails.queryOptions({
          input: {
            tokenXMint: tokenXAddress,
            tokenYMint: tokenYAddress,
          },
        }),
      ),

      queryClient.prefetchQuery({
        ...tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
          context: { cache: "force-cache" as RequestCache },
          input: {
            $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
            filterBy: {
              case: "addressesList" as const,
              value: {
                $typeName: "darklake.v1.TokenAddressesList" as const,
                tokenAddresses: [tokenXAddress, tokenYAddress],
              },
            },
            pageNumber: 1,
            pageSize: 2,
          },
        }),
        gcTime: 30 * 60 * 1000,
        queryKey: tanstackClient.dexGateway.getTokenMetadataList.queryKey({
          input: {
            $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
            filterBy: {
              case: "addressesList" as const,
              value: {
                $typeName: "darklake.v1.TokenAddressesList" as const,
                tokenAddresses: [tokenXAddress, tokenYAddress],
              },
            },
            pageNumber: 1,
            pageSize: 2,
          },
        }),
        staleTime: 10 * 60 * 1000,
      }),

      queryClient.prefetchQuery({
        ...tanstackClient.tokens.getTokenPrice.queryOptions({
          input: {
            amount: 1,
            mint: tokenXAddress,
            quoteCurrency: "USD",
          },
        }),
        gcTime: 30 * 1000,
        queryKey: queryKeys.tokens.price(tokenXAddress),
        staleTime: 5 * 1000,
      }),

      queryClient.prefetchQuery({
        ...tanstackClient.tokens.getTokenPrice.queryOptions({
          input: {
            amount: 1,
            mint: tokenYAddress,
            quoteCurrency: "USD",
          },
        }),
        gcTime: 30 * 1000,
        queryKey: queryKeys.tokens.price(tokenYAddress),
        staleTime: 5 * 1000,
      }),

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
    ]);
  } else if (isCreatePoolMode) {
    await Promise.allSettled([
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
    ]);
  } else {
    await queryClient.prefetchQuery({
      ...tanstackClient.pools.getAllPools.queryOptions({
        input: {
          includeEmpty: true,
        },
      }),
      gcTime: 10 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
    });
  }

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
          <HydrateClient client={queryClient}>
            <LiquidityPageContent
              isCreatePoolMode={isCreatePoolMode}
              tokenAAddress={parsedSearchParams.tokenAAddress}
              tokenBAddress={parsedSearchParams.tokenBAddress}
            />
          </HydrateClient>
        </div>
        <div className="hidden max-w-xs md:block">
          <FeaturesAndTrendingPoolPanel />
        </div>
      </div>
    </>
  );
}
