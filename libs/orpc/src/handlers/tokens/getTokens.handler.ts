import { database } from "@dex-web/db";
import { tokens as tokensTable } from "@dex-web/db/schemas/tokens";
import type {
  GetTokensInput,
  GetTokensOutput,
} from "../../schemas/tokens/getTokens.schema";

export const getTokensHandler = async (
  input: GetTokensInput,
): Promise<GetTokensOutput> => {
  const { limit, offset } = input;

  const tokenRows = await database
    .select()
    .from(tokensTable)
    .limit(limit)
    .offset(offset);

  const total = tokenRows.length; // Placeholder; replace with real count query if needed
  const hasMore = total === limit; // Simple heuristic

  return {
    hasMore,
    tokens: tokenRows,
    total,
  };
};
