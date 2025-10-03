import { getTokensHandler } from "../../handlers/tokens/getTokens.handler";
import { getTokensInputSchema } from "../../schemas/tokens/getTokens.schema";
import { baseProcedure } from "../base.procedure";

export const getTokens = baseProcedure
  .input(getTokensInputSchema)
  .handler(async ({ input, context }) => {
    return await getTokensHandler(input, context);
  });
