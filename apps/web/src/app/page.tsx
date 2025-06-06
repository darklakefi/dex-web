import { Text } from "@dex-web/ui";
import { FeaturedAndTrendingPoolPanel } from "../components/FeaturedAndTrendingPoolPanel";

const MOCK_POOLS = [
  {
    id: "1",
    address: "0x123",
    tokenX: {
      id: "1",
      name: "SOL",
      symbol: "SOL",
      decimals: 9,
      address: "0x123",
    },
    tokenY: {
      id: "2",
      name: "USDC",
      symbol: "USDC",
      decimals: 6,
      address: "0x123",
    },
    apr: 100,
  },
  {
    id: "1",
    address: "0x1234",
    tokenX: {
      id: "1",
      name: "SOL",
      symbol: "SOL",
      decimals: 9,
      address: "0x123",
    },
    tokenY: {
      id: "2",
      name: "USDC",
      symbol: "USDC",
      decimals: 6,
      address: "0x123",
    },
    apr: 120.12,
  },
  {
    id: "3",
    address: "0x12345",
    tokenX: {
      id: "3",
      name: "ETH",
      symbol: "ETH",
      decimals: 18,
      address: "0x456",
    },
    tokenY: {
      id: "4",
      name: "USDT",
      symbol: "USDT",
      decimals: 6,
      address: "0x789",
    },
    apr: 85.5,
  },
  {
    id: "4",
    address: "0x123456",
    tokenX: {
      id: "5",
      name: "BTC",
      symbol: "BTC",
      decimals: 8,
      address: "0xabc",
    },
    tokenY: {
      id: "2",
      name: "USDC",
      symbol: "USDC",
      decimals: 6,
      address: "0x123",
    },
    apr: 150.75,
  },
];

export default function Index() {
  return (
    <div>
      <div className="wrapper">
        <div className="container">
          <div id="welcome" className="flex flex-col items-center justify-center">
            <Text.Body1 className="animate-bounce">
              Under construction 🚧
            </Text.Body1>
            <div className="w-sm">
              <FeaturedAndTrendingPoolPanel
                featuredPools={MOCK_POOLS}
                trendingPools={MOCK_POOLS}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
