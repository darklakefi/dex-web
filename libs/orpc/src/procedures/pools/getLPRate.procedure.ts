import { getLPRateHandler } from "../../handlers/pools/getLPRate.handler";
import { getLPRateInputSchema } from "../../schemas/pools/getLPRate.schema";
import { baseProcedure } from "../base.procedure";

export const getLPRate = baseProcedure
  .input(getLPRateInputSchema)
  .handler(async ({ input }) => {
    return await getLPRateHandler(input);
  });
