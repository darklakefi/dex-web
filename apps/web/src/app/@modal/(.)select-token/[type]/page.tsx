import type { SearchParams } from "nuqs/server";
import { SelectTokenModal } from "../../../(swap)/SelectTokenModal";
import { selectedTokensCache } from "../../../(swap)/searchParams";

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
