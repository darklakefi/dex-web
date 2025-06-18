import type { SearchParams } from "nuqs/server";
import { SelectTokenModal } from "../../_components/SelectTokenModal";
import { selectedTokensCache } from "../../_utils/searchParams";

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: SearchParams;
  params: { type: "buy" | "sell" };
}) {
  await selectedTokensCache.parse(searchParams);

  return <SelectTokenModal type={params.type} />;
}
