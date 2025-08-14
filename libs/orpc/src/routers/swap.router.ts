import { getSwapDetails } from "../procedures/swaps/getSwapDetails.procedure";
import { getSwapQuote } from "../procedures/swaps/getSwapQuote.procedure";

export const swapRouter = {
  getSwapDetails,
  getSwapQuote,
};

export type SwapRouter = typeof swapRouter;
