"use server";

import type {
  GetTokenPriceInput,
  GetTokenPriceOutput,
} from "../../schemas/tokens/getTokenPrice.schema";

export const getTokenPriceHandler = async (
  input: GetTokenPriceInput,
): Promise<GetTokenPriceOutput> => {
  const { mint, amount, quoteCurrency } = input;

  const basePrice = 0;

  const totalPrice = basePrice * amount;

  return {
    mint,
    price: Math.round(totalPrice * 100) / 100,
    quoteCurrency,
  };
};
