import { tanstackClient } from "@dex-web/orpc";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { SelectTokenModal } from "../../../_components/SelectTokenModal";
import { getTokensAllowList } from "../../../_utils/getTokensAllowList";
import { selectedTokensCache } from "../../../_utils/searchParams";

const allowList = getTokensAllowList();
export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ type: "buy" | "sell" }>;
}) {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery(
    tanstackClient.tokens.getTokens.queryOptions({
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
        <SelectTokenModal
          allowList={allowList}
          returnUrl={""}
          type={(await params).type}
        />
      </Suspense>
    </HydrationBoundary>
  );
}
