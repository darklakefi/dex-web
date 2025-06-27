import { tanstackClient } from "@dex-web/orpc";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { SelectTokenModal } from "../../../[lang]/(swap)/_components/SelectTokenModal";
import { selectedTokensCache } from "../../../[lang]/(swap)/_utils/searchParams";

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ type: "buy" | "sell" }>;
}) {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(
    tanstackClient.getTokens.queryOptions({
      input: {
        limit: 8,
        offset: 0,
        query: "",
      },
    }),
  );

  await selectedTokensCache.parse(searchParams);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
        <SelectTokenModal type={(await params).type} />
      </Suspense>
    </HydrationBoundary>
  );
}
