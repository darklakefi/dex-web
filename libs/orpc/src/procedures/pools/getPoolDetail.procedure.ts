import { getPoolDetailsHandler } from "../../handlers/pools/getPoolDetails.handler";
import { getPoolDetailsInputSchema } from "../../schemas/pools/getPoolDetails.schema";
import { baseProcedure } from "../base.procedure";

export const getPoolDetails = baseProcedure
  .input(getPoolDetailsInputSchema)
  .handler(async ({ input }) => {
    return await getPoolDetailsHandler(input);
  });
