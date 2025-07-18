"use server";

import { mockPrices } from "../../mocks/tokenPrices.mock";
import type {
  GetTokenPriceInput,
  GetTokenPriceOutput,
} from "../../schemas/tokens/getTokenPrice.schema";

export const getTokenPriceHandler = async (
  input: GetTokenPriceInput,
): Promise<GetTokenPriceOutput> => {
  const { mint, amount, quoteCurrency } = input;

  const basePrice = mockPrices[mint] ?? Math.random() * 1000 + 0.01;

  const totalPrice = basePrice * amount;

  return {
    mint,
    price: Math.round(totalPrice * 100) / 100,
    quoteCurrency,
  };
};
