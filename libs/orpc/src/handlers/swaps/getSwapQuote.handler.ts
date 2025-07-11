import { generateMockGetQuote } from "../../mocks/helpers/generateMockGetQuote";
import type {
  GetQuoteInput,
  GetQuoteOutput,
} from "../../schemas/swaps/getQuote.schema";

export function getSwapQuoteHandler(input: GetQuoteInput): GetQuoteOutput {
  return generateMockGetQuote(
    `${input.amountIn}${input.isXtoY}${input.slippage}${input.tokenX}${input.tokenY}${input.poolAddress}`,
  );
}
