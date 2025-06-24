import { generateMockSwap } from "../../mocks/helpers/generateMockSwap";
import type {
  GetSwapDetailsInput,
  GetSwapDetailsOutput,
} from "../../schemas/swaps/getSwapDetails.schema";

export function getSwapDetailsHandler(
  input: GetSwapDetailsInput,
): GetSwapDetailsOutput {
  const { swapId } = input;
  return generateMockSwap(swapId);
}
