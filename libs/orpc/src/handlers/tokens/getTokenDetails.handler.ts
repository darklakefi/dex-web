"use server";

import type {
  GetTokenDetailsInput,
  GetTokenDetailsOutput,
} from "../../schemas/tokens/getTokenDetails.schema";
import { getTokensHandler } from "./getTokens.handler";

export const getTokenDetailsHandler = async (
  input: GetTokenDetailsInput,
): Promise<GetTokenDetailsOutput> => {
  const { address } = input;

  const { tokens } = await getTokensHandler({
    limit: 1,
    offset: 0,
    query: address,
  });

  const matchingToken = tokens.find((token) => token.address === address);

  if (!matchingToken) {
    throw new Error(`Token ${address} not found`);
  }

  return matchingToken;
};
