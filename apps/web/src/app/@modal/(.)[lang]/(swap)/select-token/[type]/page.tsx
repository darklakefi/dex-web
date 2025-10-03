import type { SearchParams } from "nuqs/server";
import { Suspense } from "react";
import { SelectTokenModal } from "../../../../../_components/SelectTokenModal";
import { getTokensAllowList } from "../../../../../_utils/getTokensAllowList";
import { selectedTokensCache } from "../../../../../_utils/searchParams";

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Promise<SearchParams>;
  params: Promise<{ type: "buy" | "sell" }>;
}) {
  await selectedTokensCache.parse(searchParams);

  const allowList = getTokensAllowList();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SelectTokenModal
        allowList={allowList}
        returnUrl={""}
        type={(await params).type}
      />
    </Suspense>
  );
}
