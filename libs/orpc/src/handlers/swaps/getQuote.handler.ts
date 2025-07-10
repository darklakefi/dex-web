import { generateMockGetQuote } from "../../mocks/helpers/generateMockGetQuote";
import type {
  GetQuoteInput,
  GetQuoteOutput,
} from "../../schemas/swaps/getQuote.schema";

export function getQuoteHandler(input: GetQuoteInput): GetQuoteOutput {
  return generateMockGetQuote(input);
}
