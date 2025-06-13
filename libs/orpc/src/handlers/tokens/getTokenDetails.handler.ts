import type {
  GetTokenDetailsInput,
  GetTokenDetailsOutput,
} from "../../schemas/tokens/getTokenDetails.schema";
import {
  type JupiterToken,
  jupiterTokensResponseSchema,
} from "../../schemas/tokens/jupiterTokens.schema";

export const getTokenDetailsHandler = async (
  input: GetTokenDetailsInput,
): Promise<GetTokenDetailsOutput> => {
  const { symbol } = input;

  const response = await fetch("https://token.jup.ag/strict");

  const rawData = await response.json();

  const { data, error } = jupiterTokensResponseSchema.safeParse(rawData);

  if (error) {
    throw new Error(`Invalid token data: ${error.message}`);
  }

  const jupiterToken = data.find(
    (token: JupiterToken) => token.symbol === symbol,
  );

  if (!jupiterToken) {
    throw new Error(`Token ${symbol} not found`);
  }

  return {
    imageUrl: jupiterToken.logoURI,
    symbol: jupiterToken.symbol,
    value: jupiterToken.name,
  };
};
