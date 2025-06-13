import { Text } from "@dex-web/ui";
import { SwapForm } from "./components/SwapForm";
import { DEFAULT_BUY_TOKEN, DEFAULT_SELL_TOKEN } from "./constants";

export default async function SwapPage({
  searchParams,
}: {
  searchParams: { buy: string; sell: string };
}) {
  const {
    buy: buyTokenSymbol = DEFAULT_BUY_TOKEN,
    sell: sellTokenSymbol = DEFAULT_SELL_TOKEN,
  } = await searchParams;

  const buyTokenBalance = 100;
  const sellTokenBalance = 100;

  return (
    <div className="flex flex-col items-center justify-center">
      <Text.Body1 className="animate-bounce">Under construction 🚧</Text.Body1>
      <SwapForm
        buyTokenBalance={buyTokenBalance}
        buyTokenSymbol={buyTokenSymbol}
        sellTokenBalance={sellTokenBalance}
        sellTokenSymbol={sellTokenSymbol}
      />
    </div>
  );
}
