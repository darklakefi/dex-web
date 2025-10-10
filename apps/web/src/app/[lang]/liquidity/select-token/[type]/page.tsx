import { QUERY_CONFIG, tanstackClient } from "@dex-web/orpc";
import { redirect } from "next/navigation";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import {
  getQueryClient,
  HydrateClient,
} from "../../../../../lib/query/hydration";
import {
  MAX_POOL_TOKENS_TO_FETCH,
  POPULAR_TOKEN_ADDRESSES,
} from "../../../../_components/_hooks/constants";
import { SelectTokenModal } from "../../../../_components/SelectTokenModal";
import { selectedTokensCache } from "../../../../_utils/searchParams";

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ type: "buy" | "sell" }>;
}) {
  const resolvedSearchParams = await searchParams;
  const from = resolvedSearchParams.from as string | undefined;

  if (from) {
    redirect(from as any);
  }

  await selectedTokensCache.parse(searchParams);

  const queryClient = getQueryClient();

  const [popularTokensResult, poolsResult] = await Promise.allSettled([
    queryClient.prefetchQuery({
      ...tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
        context: { cache: "force-cache" as RequestCache },
        input: {
          $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
          filterBy: {
            case: "addressesList" as const,
            value: {
              $typeName: "darklake.v1.TokenAddressesList" as const,
              tokenAddresses: POPULAR_TOKEN_ADDRESSES as string[],
            },
          },
          pageNumber: 1,
          pageSize: POPULAR_TOKEN_ADDRESSES.length,
        },
      }),
      gcTime: QUERY_CONFIG.tokenMetadata.gcTime,
      staleTime: QUERY_CONFIG.tokenMetadata.staleTime,
    }),

    queryClient.prefetchQuery({
      ...tanstackClient.pools.getAllPools.queryOptions({
        context: { cache: "force-cache" as RequestCache },
        input: {
          includeEmpty: false,
        },
      }),
      gcTime: 10 * 60 * 1000,
      staleTime: 2 * 60 * 1000,
    }),
  ]);

  if (popularTokensResult.status === "rejected") {
    console.warn(
      "Failed to prefetch popular tokens:",
      popularTokensResult.reason,
    );
  }
  if (poolsResult.status === "rejected") {
    console.warn("Failed to prefetch pools:", poolsResult.reason);
  }

  try {
    const poolsData = queryClient.getQueryData(
      tanstackClient.pools.getAllPools.queryKey({
        input: {
          includeEmpty: false,
        },
      }),
    ) as
      | { pools: Array<{ tokenXMint: string; tokenYMint: string }> }
      | undefined;

    if (poolsData?.pools && poolsData.pools.length > 0) {
      const addressSet = new Set<string>(POPULAR_TOKEN_ADDRESSES);

      for (const pool of poolsData.pools) {
        if (addressSet.size >= MAX_POOL_TOKENS_TO_FETCH) break;
        addressSet.add(pool.tokenXMint);
        if (addressSet.size >= MAX_POOL_TOKENS_TO_FETCH) break;
        addressSet.add(pool.tokenYMint);
      }

      const uniqueTokenAddresses = Array.from(addressSet);

      if (uniqueTokenAddresses.length > 0) {
        await queryClient.prefetchQuery({
          ...tanstackClient.dexGateway.getTokenMetadataList.queryOptions({
            context: { cache: "force-cache" as RequestCache },
            input: {
              $typeName: "darklake.v1.GetTokenMetadataListRequest" as const,
              filterBy: {
                case: "addressesList" as const,
                value: {
                  $typeName: "darklake.v1.TokenAddressesList" as const,
                  tokenAddresses: uniqueTokenAddresses as string[],
                },
              },
              pageNumber: 1,
              pageSize: Math.min(
                uniqueTokenAddresses.length,
                MAX_POOL_TOKENS_TO_FETCH,
              ),
            },
          }),
          gcTime: QUERY_CONFIG.poolTokensMetadata.gcTime,
          staleTime: QUERY_CONFIG.poolTokensMetadata.staleTime,
        });
      }
    }
  } catch (error) {
    console.warn("Failed to prefetch pool token metadata:", error);
  }

  return (
    <HydrateClient client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>
        <SelectTokenModal returnUrl={"liquidity"} type={(await params).type} />
      </Suspense>
    </HydrateClient>
  );
}
