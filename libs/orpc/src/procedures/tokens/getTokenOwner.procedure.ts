import { getTokenOwnerHandler } from "../../handlers/tokens/getTokenOwner.handler";
import { getTokenOwnerInputSchema } from "../../schemas/tokens/getTokenOwner.schema";
import { baseProcedure } from "../base.procedure";

export const getTokenOwner = baseProcedure
  .input(getTokenOwnerInputSchema)
  .handler(async ({ input }) => {
    return await getTokenOwnerHandler(input);
  });
