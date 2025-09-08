import { createCustomTokenHandler } from "../../../handlers/dex-gateway/custom-tokens/createCustomToken.handler";
import {
  createCustomTokenInputSchema,
  createCustomTokenOutputSchema,
} from "../../../schemas/dex-gateway/custom-tokens/createCustomToken.schema";
import { baseProcedure } from "../../base.procedure";

export const createCustomToken = baseProcedure
  .input(createCustomTokenInputSchema)
  .output(createCustomTokenOutputSchema)
  .handler(async ({ input }) => {
    return await createCustomTokenHandler(input);
  });
