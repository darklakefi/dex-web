import { editCustomTokenHandler } from "../../../handlers/dex-gateway/custom-tokens/editCustomToken.handler";
import {
  editCustomTokenInputSchema,
  editCustomTokenOutputSchema,
} from "../../../schemas/dex-gateway/custom-tokens/editCustomToken.schema";
import { baseProcedure } from "../../base.procedure";

export const editCustomToken = baseProcedure
  .input(editCustomTokenInputSchema)
  .output(editCustomTokenOutputSchema)
  .handler(async ({ input }) => {
    return await editCustomTokenHandler(input);
  });
