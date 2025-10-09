import * as z from "zod";
import { getCustomTokensHandler } from "../../handlers/dex-gateway/getCustomTokens.handler";
import { baseProcedure } from "../base.procedure";

const getCustomTokensInputSchema = z.object({
  $typeName: z
    .literal("darklake.v1.GetCustomTokensRequest")
    .default("darklake.v1.GetCustomTokensRequest"),
});

export const getCustomTokens = baseProcedure
  .input(getCustomTokensInputSchema)
  .handler(async ({ input }) => {
    return await getCustomTokensHandler(input);
  });
