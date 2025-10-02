"use client";

import { tanstackClient } from "@dex-web/orpc";
import { NumericInput, type NumericInputProps, Text } from "@dex-web/ui";
import {
  convertToDecimal,
  formatValueWithThousandSeparator,
  isValidNumberFormat,
  numberFormatHelper,
} from "@dex-web/utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useQueryStates } from "nuqs";
import { useRef } from "react";
import { selectedTokensParsers } from "../_utils/searchParams";
import { useFormatPrice } from "../_utils/useFormatPrice";
import { SkeletonLoader } from "./SkeletonLoader";

interface FormFieldsetProps extends NumericInputProps {
  name: string;
  disabled?: boolean;
  currencyCode?: string;
  controls?: React.ReactNode;
  tokenAccount?: {
    address: string;
    amount: number;
    decimals: number;
    symbol: string;
  };
  maxAmount?: number;
  maxDecimals?: number;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onClearPendingCalculations?: () => void;
  onHalfMaxClick?: (type: "half" | "max") => void;
  error?: string;
}
const QUOTE_CURRENCY = "USD" as const;

export function FormFieldset({
  name,
  onChange,
  value,
  disabled,
  tokenAccount,
  currencyCode,
  controls,
  maxAmount,
  maxDecimals,
  isLoading = false,
  isRefreshing = false,
  onClearPendingCalculations,
  onHalfMaxClick,
  error,
  ...rest
}: FormFieldsetProps) {
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const { data: usdExchangeRate } = useSuspenseQuery({
    ...tanstackClient.tokens.getTokenPrice.queryOptions({
      input: {
        amount: 1,
        mint: name === "tokenAAmount" ? tokenAAddress : tokenBAddress,
        quoteCurrency: QUOTE_CURRENCY,
      },
    }),
    staleTime: 5 * 1000,
  });

  const formattedPrice = useFormatPrice(
    value,
    usdExchangeRate.price,
    QUOTE_CURRENCY,
  );

  const inputRef = useRef<HTMLInputElement | null>(null);

  const amount = tokenAccount?.amount ?? 0;
  const tokenSymbol = tokenAccount?.symbol;
  const decimals = tokenAccount?.decimals ?? 0;
  const setValueToHalfAmount = () => {
    if (isRefreshing || isLoading || !tokenAccount?.amount) return;

    onClearPendingCalculations?.();

    const halfAmount = convertToDecimal(amount, decimals)
      .div(2)
      .toFixed(5)
      .toString();

    if (inputRef.current) {
      inputRef.current.value = halfAmount;
      const event = new Event("change", { bubbles: true });
      inputRef.current.dispatchEvent(event);
    }

    onChange?.({
      target: { value: halfAmount },
    } as React.ChangeEvent<HTMLInputElement>);

    onHalfMaxClick?.("half");
  };

  const setValueToMaxAmount = () => {
    if (isRefreshing || isLoading || !tokenAccount?.amount) return;

    onClearPendingCalculations?.();

    const maxAmount = convertToDecimal(amount, decimals).toFixed(5).toString();

    if (inputRef.current) {
      inputRef.current.value = maxAmount;
      const event = new Event("change", { bubbles: true });
      inputRef.current.dispatchEvent(event);
    }

    onChange?.({
      target: { value: maxAmount },
    } as React.ChangeEvent<HTMLInputElement>);

    onHalfMaxClick?.("max");
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;

    if (value.endsWith(",")) {
      value = `${value.slice(0, -1)}.`;
    }

    const cleanValue = value.replace(/,/g, "");
    if (value && !isValidNumberFormat(cleanValue)) {
      return;
    }

    if (maxDecimals) {
      const [_, decimalPart] = cleanValue.split(".");
      if (decimalPart && decimalPart.length > maxDecimals) {
        return;
      }
    }

    if (maxAmount && Number(cleanValue) > maxAmount) {
      return;
    }

    onChange?.({
      target: {
        value: cleanValue,
      },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <fieldset className="flex min-w-0 flex-1 flex-col items-end gap-3">
      <div className="mb-3 flex gap-3">
        {controls ? (
          controls
        ) : (
          <div className="flex gap-3 font-normal font-sans text-green-300 text-lg uppercase leading-6 tracking-wider">
            <span className="relative flex items-center">
              {(isLoading && !tokenAccount) || !tokenAccount ? (
                <SkeletonLoader className="w-28" variant="balance" />
              ) : (
                <>
                  <span>
                    {numberFormatHelper({
                      decimalScale: 2,
                      thousandSeparator: true,
                      trimTrailingZeros: true,
                      value: convertToDecimal(amount, decimals).toString(),
                    })}{" "}
                    {tokenSymbol}
                  </span>
                  {isRefreshing && (
                    <div className="ml-2 h-3 w-3 animate-spin rounded-full border border-green-300 border-t-transparent opacity-70"></div>
                  )}
                </>
              )}
            </span>
            {tokenAccount && (
              <>
                <button
                  className={`uppercase underline ${
                    isRefreshing || isLoading
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                  disabled={isRefreshing || isLoading}
                  onClick={setValueToHalfAmount}
                  type="button"
                >
                  Half
                </button>
                <button
                  className={`uppercase underline ${
                    isRefreshing || isLoading
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                  disabled={isRefreshing || isLoading}
                  onClick={setValueToMaxAmount}
                  type="button"
                >
                  Max
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
          <NumericInput
            autoComplete="off"
            className={!formattedPrice ? "leading-10" : ""}
            disabled={disabled || (isLoading && !tokenAccount)}
            name={name}
            onChange={handleChange}
            placeholder={
              (!tokenAccount && !currencyCode) || isLoading
                ? "Loading..."
                : "0.00"
            }
            ref={inputRef}
            type="text"
            value={formatValueWithThousandSeparator(
              String(value) ?? "0",
              maxDecimals,
            )}
            {...rest}
          />
          {currencyCode && (
            <Text.Body2 className="text-2xl text-green-300 uppercase">
              {currencyCode}
            </Text.Body2>
          )}
        </div>
        <Text.Body2 className="text-green-300 uppercase">
          {formattedPrice}
        </Text.Body2>
        {error && <Text.Body2 className="text-red-500">{error}</Text.Body2>}
      </div>
    </fieldset>
  );
}
