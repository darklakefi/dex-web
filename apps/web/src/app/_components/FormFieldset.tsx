"use client";

import type { GetTokenPriceOutput } from "@dex-web/orpc/schemas/index";
import { NumericInput, type NumericInputProps, Text } from "@dex-web/ui";
import {
  calculateSafeMaxAmount,
  convertToDecimal,
  formatValueWithThousandSeparator,
  isValidNumberFormat,
  numberFormatHelper,
} from "@dex-web/utils";
import { useRef } from "react";
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
  /**
   * Optional price data to avoid suspense waterfall.
   * If not provided, price display will be hidden.
   */
  tokenPrice?: GetTokenPriceOutput | null;
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
  tokenPrice,
  ...rest
}: FormFieldsetProps) {
  const formattedPrice = useFormatPrice(
    value,
    tokenPrice?.price ?? 0,
    QUOTE_CURRENCY,
  );

  const inputRef = useRef<HTMLInputElement | null>(null);

  const amount = tokenAccount?.amount ?? 0;
  const tokenSymbol = tokenAccount?.symbol;
  const decimals = tokenAccount?.decimals ?? 0;
  const setValueToHalfAmount = () => {
    if (isRefreshing || isLoading || !tokenAccount?.amount) return;

    onClearPendingCalculations?.();

    const halfAtomicAmount = Math.floor(amount / 2);
    const halfAmount = calculateSafeMaxAmount({
      atomicAmount: halfAtomicAmount,
      decimals,
      maxDecimals,
    });

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

    const maxAmount = calculateSafeMaxAmount({
      atomicAmount: amount,
      decimals,
      maxDecimals,
    });

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
                <span>
                  {numberFormatHelper({
                    decimalScale: 2,
                    thousandSeparator: true,
                    trimTrailingZeros: true,
                    value: convertToDecimal(amount, decimals).toString(),
                  })}{" "}
                  {tokenSymbol}
                </span>
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
        {tokenPrice && (
          <Text.Body2 className="text-green-300 uppercase">
            {formattedPrice}
          </Text.Body2>
        )}
        {error && <Text.Body2 className="text-red-500">{error}</Text.Body2>}
      </div>
    </fieldset>
  );
}
