import { Box, Text } from "@dex-web/ui";
import { SelectTokenButton } from "./SelectTokenButton";
import { SwapDetails } from "./SwapDetails";
import { SwapFormFieldset } from "./SwapFormFieldset";

export function SwapForm() {
  // TODO: Get balances from API
  const buyTokenBalance = 100;
  const sellTokenBalance = 100;

  return (
    <section className="flex w-full max-w-xl">
      <Box padding="lg">
        <Box background="highlight" className="flex-row">
          <div>
            <Text.Body2
              as="label"
              className="mb-6 block text-green-300 uppercase"
            >
              Selling
            </Text.Body2>
            <SelectTokenButton type="sell" />
          </div>
          <SwapFormFieldset balance={sellTokenBalance} label="Amount" />
        </Box>
        <Box background="highlight" className="flex-row">
          <div>
            <Text.Body2
              as="label"
              className="mb-6 block text-green-300 uppercase"
            >
              Buying
            </Text.Body2>
            <SelectTokenButton type="buy" />
          </div>
          <SwapFormFieldset balance={buyTokenBalance} label="Amount" />
        </Box>
        <SwapDetails />
      </Box>
    </section>
  );
}
