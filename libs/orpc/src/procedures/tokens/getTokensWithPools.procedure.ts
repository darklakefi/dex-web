import { getTokensWithPoolsHandler } from "../../handlers/tokens/getTokensWithPools.handler";
import { getTokensWithPoolsInputSchema } from "../../schemas/tokens/getTokensWithPools.schema";
import { baseProcedure } from "../base.procedure";

export const getTokensWithPools = baseProcedure
  .input(getTokensWithPoolsInputSchema)
  .handler(async ({ input }) => {
    return await getTokensWithPoolsHandler(input);
  });
