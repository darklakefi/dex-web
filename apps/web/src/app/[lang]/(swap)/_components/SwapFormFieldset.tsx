"use client";

import { tanstackClient } from "@dex-web/orpc";
import { NumericInput, type NumericInputProps, Text } from "@dex-web/ui";
import { convertToDecimal, numberFormatHelper } from "@dex-web/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { useRef } from "react";
import { selectedTokensParsers } from "../_utils/searchParams";
import { useFormatPrice } from "../_utils/useFormatPrice";

interface SwapFormFieldsetProps extends NumericInputProps {
  name: "buyAmount" | "sellAmount";
  disabled?: boolean;
}
const QUOTE_CURRENCY = "USD" as const;

export function SwapFormFieldset({
  name,
  onChange,
  value,
  disabled,
  ...rest
}: SwapFormFieldsetProps) {
  const { publicKey } = useWallet();
  const [{ buyTokenAddress, sellTokenAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const { data } = useSuspenseQuery(
    tanstackClient.helius.getTokenAccounts.queryOptions({
      input: {
        mint: name === "buyAmount" ? buyTokenAddress : sellTokenAddress,
        ownerAddress: publicKey?.toBase58() ?? "",
      },
    }),
  );

  const { data: usdExchangeRate } = useSuspenseQuery(
    tanstackClient.getTokenPrice.queryOptions({
      input: {
        amount: 1,
        mint: name === "buyAmount" ? buyTokenAddress : sellTokenAddress,
        quoteCurrency: QUOTE_CURRENCY,
      },
    }),
  );

  const formattedPrice = useFormatPrice(
    value,
    usdExchangeRate.price,
    QUOTE_CURRENCY,
  );

  const inputRef = useRef<HTMLInputElement | null>(null);

  const amount = data.tokenAccounts[0]?.amount ?? 0;
  const tokenSymbol = data.tokenAccounts[0]?.symbol;
  const decimals = data.tokenAccounts[0]?.decimals ?? 0;
  const setValueToHalfAmount = () => {
    if (inputRef.current) {
      inputRef.current.value = convertToDecimal(amount, decimals)
        .div(2)
        .toFixed(20)
        .toString();
      const event = new Event("change", { bubbles: true });
      inputRef.current.dispatchEvent(event);
      onChange?.({
        target: {
          value: inputRef.current.value,
        },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const setValueToMaxAmount = () => {
    if (inputRef.current) {
      inputRef.current.value = convertToDecimal(amount, decimals)
        .toFixed(20)
        .toString();
      const event = new Event("change", { bubbles: true });
      inputRef.current.dispatchEvent(event);
      onChange?.({
        target: {
          value: inputRef.current.value,
        },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <fieldset className="flex min-w-0 flex-1 flex-col items-end gap-3">
      <div className="mb-3 flex gap-3">
        <Text.Body2 className="text-green-300 uppercase">
          {amount
            ? `${numberFormatHelper({
                decimalScale: 2,
                thousandSeparator: true,
                trimTrailingZeros: true,
                value: convertToDecimal(amount, decimals),
              })}`
            : "0.00"}{" "}
          {tokenSymbol}{" "}
          <button
            className="cursor-pointer uppercase underline"
            onClick={setValueToHalfAmount}
            type="button"
          >
            Half
          </button>{" "}
          <button
            className="cursor-pointer uppercase underline"
            onClick={setValueToMaxAmount}
            type="button"
          >
            Max
          </button>
        </Text.Body2>
      </div>
      <div className="flex flex-col items-end">
        <NumericInput
          disabled={disabled}
          name={name}
          onChange={onChange}
          placeholder="0.00"
          ref={inputRef}
          value={value}
          {...rest}
        />
        <Text.Body2 className="text-green-300 uppercase">
          {formattedPrice}
        </Text.Body2>
      </div>
    </fieldset>
  );
}
