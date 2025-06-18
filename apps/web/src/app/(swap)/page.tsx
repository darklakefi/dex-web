import type { SearchParams } from "nuqs/server";
import { SwapForm } from "./_components/SwapForm";
import { selectedTokensCache } from "./_utils/searchParams";

interface SwapPageProps {
  searchParams: SearchParams;
}
export default async function SwapPage({ searchParams }: SwapPageProps) {
  await selectedTokensCache.parse(searchParams);

  return (
    <div className="flex flex-col items-center justify-center">
      <SwapForm />
    </div>
  );
}
