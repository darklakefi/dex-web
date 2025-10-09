import { notFound } from "next/navigation";
import { PoolsHeader } from "./PoolsHeader";
import { PoolsList } from "./PoolsList";

const MOCK_TVL = "$421.23M";
const MOCK_VOLUME = "$123.45M";
const MOCK_FEES = "$12.34M";

export default function PoolsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PoolsHeader fees={MOCK_FEES} tvl={MOCK_TVL} volume={MOCK_VOLUME} />
      <PoolsList />
    </div>
  );
}
