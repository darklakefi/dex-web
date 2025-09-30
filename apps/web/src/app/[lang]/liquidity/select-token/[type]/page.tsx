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

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SelectTokenModal returnUrl={"liquidity"} type={(await params).type} />
    </Suspense>
  );
}
