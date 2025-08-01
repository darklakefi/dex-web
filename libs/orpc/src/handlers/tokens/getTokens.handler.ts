"use server";

import { tokensData, tokensDataMainnet } from "../../mocks/tokens.mock";
import type {
  GetTokensInput,
  GetTokensOutput,
} from "../../schemas/tokens/getTokens.schema";
import { jupiterTokensResponseSchema } from "../../schemas/tokens/jupiterTokens.schema";

export const getTokensHandler = async (
  input: GetTokensInput,
): Promise<GetTokensOutput> => {
  const { limit, query } = input;

  const rawData = process.env.NETWORK === "2" ? tokensData : tokensDataMainnet;

  const { data, error } = jupiterTokensResponseSchema.safeParse(rawData);

  if (error) {
    throw new Error(`Invalid token data: ${error.message}`);
  }

  return {
    hasMore: (data?.length ?? 0) > limit,
    tokens: (data ?? [])
      .filter(
        (token) =>
          token.name.toLowerCase().includes(query?.toLowerCase() ?? "") ||
          token.symbol.toLowerCase().includes(query?.toLowerCase() ?? "") ||
          token.address.toLowerCase().includes(query?.toLowerCase() ?? ""),
      )
      .slice(0, limit)
      .map((token) => ({
        address: token.address,
        decimals: token.decimals,
        imageUrl: token.logoURI,
        name: token.name,
        symbol: token.symbol,
        value: token.address,
      })),
    total: data?.length ?? 0,
  };
};
