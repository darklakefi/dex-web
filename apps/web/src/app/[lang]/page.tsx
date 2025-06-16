import { Text } from "@dex-web/ui";
import { useTranslations } from "next-intl";
import { FeaturedAndTrendingPoolPanel } from "../../components/FeaturedAndTrendingPoolPanel";

const MOCK_POOLS = [
  {
    address: "0x123",
    apr: 100,
    id: "1",
    tokenX: {
      address: "0x123",
      decimals: 9,
      id: "1",
      name: "SOL",
      symbol: "SOL",
    },
    tokenY: {
      address: "0x123",
      decimals: 6,
      id: "2",
      name: "USDC",
      symbol: "USDC",
    },
  },
  {
    address: "0x1234",
    apr: 120.12,
    id: "1",
    tokenX: {
      address: "0x123",
      decimals: 9,
      id: "1",
      name: "SOL",
      symbol: "SOL",
    },
    tokenY: {
      address: "0x123",
      decimals: 6,
      id: "2",
      name: "USDC",
      symbol: "USDC",
    },
  },
  {
    address: "0x12345",
    apr: 85.5,
    id: "3",
    tokenX: {
      address: "0x456",
      decimals: 18,
      id: "3",
      name: "ETH",
      symbol: "ETH",
    },
    tokenY: {
      address: "0x789",
      decimals: 6,
      id: "4",
      name: "USDT",
      symbol: "USDT",
    },
  },
  {
    address: "0x123456",
    apr: 150.75,
    id: "4",
    tokenX: {
      address: "0xabc",
      decimals: 8,
      id: "5",
      name: "BTC",
      symbol: "BTC",
    },
    tokenY: {
      address: "0x123",
      decimals: 6,
      id: "2",
      name: "USDC",
      symbol: "USDC",
    },
  },
];

export default function IndexPage() {
  const t = useTranslations("common");
  return (
    <div>
      <div className="wrapper">
        <div className="container">
          <div className="flex flex-col items-center justify-center">
            <Text.Body1
              className="animate-bounce"
              data-testid="under-construction"
            >
              Under construction 🚧
            </Text.Body1>
            <Text.Body1>{t("welcome")}</Text.Body1>
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
