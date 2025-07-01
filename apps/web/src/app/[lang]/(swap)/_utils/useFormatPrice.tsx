"use client";

import { BigDecimal } from "effect";
import { useFormatter } from "next-intl";

export function useFormatPrice(
  value: string | number | readonly string[] | undefined,
  exchangeRate: number,
  quoteCurrency: string,
) {
  const format = useFormatter();

  const valueAsBigDecimal = BigDecimal.unsafeFromString(String(value ?? "0"));
  const exchangeRateAsBigDecimal = BigDecimal.unsafeFromString(
    String(exchangeRate),
  );
  const amountInUsd = BigDecimal.format(
    BigDecimal.multiply(valueAsBigDecimal, exchangeRateAsBigDecimal),
  );

  const formattedPrice = format.number(Number(amountInUsd), {
    currency: quoteCurrency,
    style: "currency",
  });

  return formattedPrice;
}
