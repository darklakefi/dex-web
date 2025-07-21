import { PoolsHeader } from "./PoolsHeader";

const MOCK_TVL = "$421.23M";
const MOCK_VOLUME = "$123.45M";
const MOCK_FEES = "$12.34M";

export default function PoolsPage() {
  return <PoolsHeader fees={MOCK_FEES} tvl={MOCK_TVL} volume={MOCK_VOLUME} />;
}
