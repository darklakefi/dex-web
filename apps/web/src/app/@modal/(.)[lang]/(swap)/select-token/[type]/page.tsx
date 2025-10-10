import { QUERY_CONFIG, tanstackClient } from "@dex-web/orpc";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import {
  getQueryClient,
  HydrateClient,
} from "../../../../../../lib/query/hydration";
import {
  MAX_POOL_TOKENS_TO_FETCH,
  POPULAR_TOKEN_ADDRESSES,
} from "../../../../../_components/_hooks/constants";
import { SelectTokenModal } from "../../../../../_components/SelectTokenModal";
import { selectedTokensCache } from "../../../../../_utils/searchParams";

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ type: "buy" | "sell" }>;
}) {
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
      const addressSet = new Set<string>();

      POPULAR_TOKEN_ADDRESSES.forEach((addr) => addressSet.add(addr));

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
      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="flex max-h-full w-full max-w-sm flex-col gap-4 rounded-lg bg-gray-900 p-6 drop-shadow-xl">
              <div className="h-12 w-full animate-pulse rounded bg-green-600/40" />
              <div className="space-y-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    className="flex items-center gap-3"
                    key={`skeleton-${i}`}
                  >
                    <div className="size-8 animate-pulse rounded-full bg-green-600/40" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-16 animate-pulse rounded bg-green-600/40" />
                      <div className="h-3 w-24 animate-pulse rounded bg-green-600/40" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      >
        <SelectTokenModal returnUrl={""} type={(await params).type} />
      </Suspense>
    </HydrateClient>
  );
}
