import { getCustomTokensHandler } from "../../../handlers/dex-gateway/custom-tokens/getCustomTokens.handler";
import { getCustomTokensOutputSchema } from "../../../schemas/dex-gateway/custom-tokens/getCustomTokens.schema";
import { baseProcedure } from "../../base.procedure";

export const getCustomTokens = baseProcedure
  .output(getCustomTokensOutputSchema)
  .handler(async () => {
    return await getCustomTokensHandler();
  });
