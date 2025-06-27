"use client";

import { tanstackClient } from "@dex-web/orpc";
import { NumericInput, type NumericInputProps, Text } from "@dex-web/ui";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { useRef } from "react";
import { MOCK_OWNER_ADDRESS } from "../_utils/constants";
import { selectedTokensParsers } from "../_utils/searchParams";

interface SwapFormFieldsetProps extends NumericInputProps {
  name: "buyAmount" | "sellAmount";
}

export function SwapFormFieldset({
  name,
  onChange,
  ...rest
}: SwapFormFieldsetProps) {
  const [{ buyTokenAddress, sellTokenAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const { data } = useSuspenseQuery(
    tanstackClient.helius.getTokenAccounts.queryOptions({
      input: {
        mint: name === "buyAmount" ? buyTokenAddress : sellTokenAddress,
        ownerAddress: MOCK_OWNER_ADDRESS,
      },
    }),
  );

  const inputRef = useRef<HTMLInputElement | null>(null);

  const amount = data.tokenAccounts[0]?.amount ?? 0;
  const tokenSymbol = data.tokenAccounts[0]?.symbol;

  const setValueToHalfAmount = () => {
    if (inputRef.current) {
      inputRef.current.value = (amount / 2).toString();
      const event = new Event("change", { bubbles: true });
      inputRef.current.dispatchEvent(event);
    }
  };

  const setValueToMaxAmount = () => {
    if (inputRef.current) {
      inputRef.current.value = amount.toString();
      const event = new Event("change", { bubbles: true });
      inputRef.current.dispatchEvent(event);
    }
  };

  return (
    <fieldset className="flex min-w-0 flex-1 flex-col items-end gap-3">
      <div className="mb-3 flex gap-3">
        <Text.Body2 className="text-green-300 uppercase">
          {amount ? `${amount}` : "0.00"} {tokenSymbol}{" "}
          <button
            className="uppercase underline"
            onClick={setValueToHalfAmount}
            type="button"
          >
            Half
          </button>{" "}
          <button
            className="uppercase underline"
            onClick={setValueToMaxAmount}
            type="button"
          >
            Max
          </button>
        </Text.Body2>
      </div>
      <NumericInput
        name={name}
        onChange={onChange}
        placeholder="Amount"
        ref={inputRef}
        {...rest}
      />
    </fieldset>
  );
}
