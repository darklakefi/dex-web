import type { SearchParams } from "nuqs/server";
import { SwapForm } from "./_components/SwapForm";
import { selectedTokensCache } from "./_utils/searchParams";

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await selectedTokensCache.parse(searchParams);

  return (
    <div className="flex flex-col items-center justify-center">
      <SwapForm />
    </div>
  );
}
