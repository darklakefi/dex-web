import z from "zod";
import { baseProcedure } from "../../../procedures/baseProcedure";
import { searchAssetsHandler } from "../handlers/searchAssets.handler";

const getTokenListInputSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const getTokenList = baseProcedure
  .input(getTokenListInputSchema)
  .handler(async ({ input }) => {
    return await searchAssetsHandler({ input });
  });
