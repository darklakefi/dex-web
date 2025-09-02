import { getCustomTokenHandler } from "../../../handlers/dex-gateway/custom-tokens/getCustomToken.handler";
import {
  getCustomTokenInputSchema,
  getCustomTokenOutputSchema,
} from "../../../schemas/dex-gateway/custom-tokens/getCustomToken.schema";
import { baseProcedure } from "../../base.procedure";

export const getCustomToken = baseProcedure
  .input(getCustomTokenInputSchema)
  .output(getCustomTokenOutputSchema)
  .handler(async ({ input }) => {
    return await getCustomTokenHandler(input);
  });
