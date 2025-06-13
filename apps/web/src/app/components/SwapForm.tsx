import { Box, Text } from "@dex-web/ui";
import { SwapFormFieldset } from "./SwapFormFieldset";

interface SwapFormProps {
  buyToken: string;
  sellToken: string;
  buyTokenBalance: number;
  sellTokenBalance: number;
}

export function SwapForm({
  buyToken,
  sellToken,
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
            <Text.Body2>{sellToken}</Text.Body2>
          </div>
          <SwapFormFieldset balance={sellTokenBalance} label="Amount" />
        </Box>
        <Box background="highlight" className="flex-row">
          <div>
            <Text.Body2 as="label" className="text-green-300 uppercase">
              Buying
            </Text.Body2>
            <Text.Body2>{buyToken}</Text.Body2>
          </div>
          <SwapFormFieldset balance={buyTokenBalance} label="Amount" />
        </Box>
      </Box>
    </section>
  );
}
