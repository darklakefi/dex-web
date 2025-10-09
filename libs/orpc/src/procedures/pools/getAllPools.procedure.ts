import { getAllPoolsHandler } from "../../handlers/pools/getAllPools.handler";
import { getAllPoolsInputSchema } from "../../schemas/pools/getAllPools.schema";
import { baseProcedure } from "../base.procedure";

export const getAllPools = baseProcedure
  .input(getAllPoolsInputSchema)
  .handler(async ({ input }) => {
    return await getAllPoolsHandler(input);
  });
