import { QUERY_CONFIG, tanstackClient, tokenQueryKeys } from "@dex-web/orpc";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { SelectTokenModal } from "../../../../_components/SelectTokenModal";
import { selectedTokensCache } from "../../../../_utils/searchParams";

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ type: "buy" | "sell" }>;
}) {
  await selectedTokensCache.parse(searchParams);

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    ...tanstackClient.pools.getAllPools.queryOptions({
      input: {
        includeEmpty: true,
      },
    }),
    gcTime: 10 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });

  const poolsData = queryClient.getQueryData(
    tanstackClient.pools.getAllPools.queryOptions({
      input: {
        includeEmpty: true,
      },
    }).queryKey,
  ) as { pools: Array<{ tokenXMint: string; tokenYMint: string }> } | undefined;

  if (poolsData?.pools && poolsData.pools.length > 0) {
    const uniqueTokenAddresses = Array.from(
      new Set(
        poolsData.pools.flatMap((pool) => [pool.tokenXMint, pool.tokenYMint]),
      ),
    );

    if (uniqueTokenAddresses.length > 0) {
      await queryClient.prefetchQuery({
        ...tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
          input: {
            $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
            filterBy: {
              case: "addressesList" as const,
              value: {
                $typeName: "darklake.v1.TokenAddressesList" as const,
                tokenAddresses: uniqueTokenAddresses,
              },
            },
            pageNumber: 1,
            pageSize: 10000,
          },
        }),
        gcTime: QUERY_CONFIG.poolTokensMetadata.gcTime,
        queryKey: tokenQueryKeys.metadata.poolTokens(),
        staleTime: QUERY_CONFIG.poolTokensMetadata.staleTime,
      });
    }
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <Suspense fallback={<div>Loading...</div>}>
        <SelectTokenModal returnUrl={""} type={(await params).type} />
      </Suspense>
    </HydrationBoundary>
  );
}
