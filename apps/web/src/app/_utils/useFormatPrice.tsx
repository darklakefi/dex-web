"use client";

import { BigDecimal } from "effect";
import { useFormatter } from "next-intl";
import * as z from "zod";

const useFormatPriceSchema = z.object({
  exchangeRate: z.number().nonnegative(),
  quoteCurrency: z.string(),
  value: z.number().nonnegative(),
});

export function useFormatPrice(
  value: string | number | readonly string[] | undefined,
  exchangeRate: number,
  quoteCurrency: string,
) {
  const format = useFormatter();

  if (!exchangeRate) {
    return "";
  }

  const { success, data: parsedData } = useFormatPriceSchema.safeParse({
    exchangeRate,
    quoteCurrency,
    value: Number(value),
  });

  if (!success) {
    return "$0.00";
  }

  const {
    value: parsedValue,
    exchangeRate: parsedExchangeRate,
    quoteCurrency: parsedQuoteCurrency,
  } = parsedData;

  const valueAsBigDecimal = BigDecimal.unsafeFromNumber(parsedValue);
  const exchangeRateAsBigDecimal = BigDecimal.unsafeFromString(
    String(parsedExchangeRate),
  );
  const amountInUsd = BigDecimal.format(
    BigDecimal.multiply(valueAsBigDecimal, exchangeRateAsBigDecimal),
  );

  const formattedPrice = format.number(Number(amountInUsd), {
    currency: parsedQuoteCurrency,
    style: "currency",
  });

  return formattedPrice;
}
