"use client";

import { tanstackClient } from "@dex-web/orpc";
import { Box, Text } from "@dex-web/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { MOCK_OWNER_ADDRESS } from "../_utils/constants";
import { selectedTokensParsers } from "../_utils/searchParams";
import { SelectTokenButton } from "./SelectTokenButton";
import { SwapFormFieldset } from "./SwapFormFieldset";

export function SwapFormFieldsets() {
  const { data: balances } = useSuspenseQuery(
    tanstackClient.helius.getTokenBalance.queryOptions({
      input: { ownerAddress: MOCK_OWNER_ADDRESS },
    }),
  );

  const [{ buyTokenAddress, sellTokenAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const buyTokenBalance =
    balances?.tokenAccounts.find((account) => account.mint === buyTokenAddress)
      ?.amount ?? 0;

  const sellTokenBalance =
    balances?.tokenAccounts.find((account) => account.mint === sellTokenAddress)
      ?.amount ?? 0;

  // TODO: Convert balance using token decimals
  return (
    <div>
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
    </div>
  );
}
