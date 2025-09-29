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
  ...rest
}: FormFieldsetProps) {
  const [{ tokenAAddress, tokenBAddress }] = useQueryStates(
    selectedTokensParsers,
  );

  const { data: usdExchangeRate } = useSuspenseQuery(
    tanstackClient.tokens.getTokenPrice.queryOptions({
      input: {
        amount: 1,
        mint: name === "tokenAAmount" ? tokenAAddress : tokenBAddress,
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

  const amount = tokenAccount?.amount ?? 0;
  const tokenSymbol = tokenAccount?.symbol;
  const decimals = tokenAccount?.decimals ?? 0;
  const setValueToHalfAmount = () => {
    // Prevent action during refresh or loading to avoid race conditions
    if (isRefreshing || isLoading || !tokenAccount?.amount) return;

    // Clear any pending debounced calculations
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

    // Direct onChange call with calculated value
    onChange?.({
      target: { value: halfAmount },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const setValueToMaxAmount = () => {
    // Prevent action during refresh or loading to avoid race conditions
    if (isRefreshing || isLoading || !tokenAccount?.amount) return;

    // Clear any pending debounced calculations
    onClearPendingCalculations?.();

    const maxAmount = convertToDecimal(amount, decimals)
      .toFixed(5)
      .toString();

    if (inputRef.current) {
      inputRef.current.value = maxAmount;
      const event = new Event("change", { bubbles: true });
      inputRef.current.dispatchEvent(event);
    }

    // Direct onChange call with calculated value
    onChange?.({
      target: { value: maxAmount },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;

    // if the last character is a comma, replace it with a dot
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
        value,
      },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <fieldset className="flex min-w-0 flex-1 flex-col items-end gap-3">
      <div className="mb-3 flex gap-3">
        {controls ? (
          controls
        ) : (
          <Text.Body2 className="flex gap-3 text-green-300 uppercase">
            <span className="relative flex items-center">
              {isLoading && !tokenAccount ? (
                <SkeletonLoader variant="text" className="w-28" />
              ) : (
                <>
                  <span>
                    {amount
                      ? `${numberFormatHelper({
                          decimalScale: 2,
                          thousandSeparator: true,
                          trimTrailingZeros: true,
                          value: convertToDecimal(amount, decimals),
                        })}`
                      : "0.00"}{" "}
                    {tokenSymbol}
                  </span>
                  {isRefreshing && (
                    <div className="ml-2 h-3 w-3 animate-spin rounded-full border border-green-300 border-t-transparent opacity-70"></div>
                  )}
                </>
              )}
            </span>
            {!isLoading && tokenAccount && (
              <>
                <button
                  className={`uppercase underline ${
                    isRefreshing || isLoading
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                  onClick={setValueToHalfAmount}
                  disabled={isRefreshing || isLoading}
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
                  onClick={setValueToMaxAmount}
                  disabled={isRefreshing || isLoading}
                  type="button"
                >
                  Max
                </button>
              </>
            )}
          </Text.Body2>
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
            placeholder={isLoading && !tokenAccount ? "Loading..." : "0.00"}
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
      </div>
    </fieldset>
  );
}
