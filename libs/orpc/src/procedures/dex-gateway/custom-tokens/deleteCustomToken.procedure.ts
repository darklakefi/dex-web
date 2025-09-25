import { deleteCustomTokenHandler } from "../../../handlers/dex-gateway/custom-tokens/deleteCustomToken.handler";
import {
  deleteCustomTokenInputSchema,
  deleteCustomTokenOutputSchema,
} from "../../../schemas/dex-gateway/custom-tokens/deleteCustomToken.schema";
import { baseProcedure } from "../../base.procedure";

export const deleteCustomToken = baseProcedure
  .input(deleteCustomTokenInputSchema)
  .output(deleteCustomTokenOutputSchema)
  .handler(async ({ input }) => {
    return await deleteCustomTokenHandler(input);
  });
