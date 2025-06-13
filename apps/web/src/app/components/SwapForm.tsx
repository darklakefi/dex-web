import { Box, Text } from "@dex-web/ui";
import { SelectTokenButton } from "./SelectTokenButton";
import { SwapFormFieldset } from "./SwapFormFieldset";

interface SwapFormProps {
  buyTokenSymbol: string;
  sellTokenSymbol: string;
  buyTokenBalance: number;
  sellTokenBalance: number;
}

export async function SwapForm({
  buyTokenSymbol,
  sellTokenSymbol,
  buyTokenBalance,
  sellTokenBalance,
}: SwapFormProps) {
  return (
    <section className="flex w-full max-w-xl">
      <Box padding="lg">
        <Box background="highlight" className="flex-row">
          <div>
            <Text.Body2 as="label" className="text-green-300 uppercase">
              Selling
            </Text.Body2>
            <SelectTokenButton symbol={sellTokenSymbol} />
          </div>
          <SwapFormFieldset balance={sellTokenBalance} label="Amount" />
        </Box>
        <Box background="highlight" className="flex-row">
          <div>
            <Text.Body2 as="label" className="text-green-300 uppercase">
              Buying
            </Text.Body2>
            <SelectTokenButton symbol={buyTokenSymbol} />
          </div>
          <SwapFormFieldset balance={buyTokenBalance} label="Amount" />
        </Box>
      </Box>
    </section>
  );
}
