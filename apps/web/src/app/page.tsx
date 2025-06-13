import { client } from "@dex-web/orpc";
import { Text } from "@dex-web/ui";
import { SwapForm } from "./components/SwapForm";
import { DEFAULT_BUY_TOKEN, DEFAULT_SELL_TOKEN } from "./constants";

export default async function SwapPage({
  searchParams,
}: {
  searchParams: { buyToken: string; sellToken: string };
}) {
  const { buyToken = DEFAULT_BUY_TOKEN, sellToken = DEFAULT_SELL_TOKEN } =
    await searchParams;

  const tokenList = await client.helius.searchAssets({
    limit: 100,
  });

  console.log({ tokenList });

  const buyTokenBalance = 100;
  const sellTokenBalance = 100;

  return (
    <div className="flex flex-col items-center justify-center">
      <Text.Body1 className="animate-bounce">Under construction 🚧</Text.Body1>
      <SwapForm
        buyToken={buyToken}
        buyTokenBalance={buyTokenBalance}
        sellToken={sellToken}
        sellTokenBalance={sellTokenBalance}
      />
    </div>
  );
}
