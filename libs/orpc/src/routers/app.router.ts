import { getTokenDetails } from "../procedures/tokens/getTokenDetails.procedure";
import { heliusRouter } from "./helius.router";

export const appRouter = {
  getTokenDetails,
  helius: heliusRouter,
};
