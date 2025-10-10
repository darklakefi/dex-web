import { redirect } from "next/navigation";
import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import {
  getQueryClient,
  HydrateClient,
} from "../../../../../lib/query/hydration";
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
  const from = resolvedSearchParams.from;

  if (from && typeof from === "string") {
    redirect(from as never);
  }

  await selectedTokensCache.parse(searchParams);

  const queryClient = getQueryClient();

  return (
    <HydrateClient client={queryClient}>
      <Suspense fallback={<div>Loading...</div>}>
        <SelectTokenModal returnUrl={"liquidity"} type={(await params).type} />
      </Suspense>
    </HydrateClient>
  );
}
