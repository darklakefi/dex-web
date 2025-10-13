import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import {
  getQueryClient,
  HydrateClient,
} from "../../../../../../lib/query/hydration";
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
        <SelectTokenModal type={(await params).type} />
      </Suspense>
    </HydrateClient>
  );
}
