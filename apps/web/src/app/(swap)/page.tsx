import type { SearchParams } from "nuqs/server";
import { SwapForm } from "./SwapForm";
import { selectedTokensCache } from "./searchParams";

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
