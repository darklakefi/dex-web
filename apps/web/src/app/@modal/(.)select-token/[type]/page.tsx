import type { SearchParams } from "nuqs/server";
import { SelectTokenModal } from "../../../(swap)/_components/SelectTokenModal";
import { selectedTokensCache } from "../../../(swap)/_utils/searchParams";

export const dynamic = "force-dynamic";

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
