import { searchAssetsHandler } from "../../handlers/helius/searchAssets.handler";
import { searchAssetsInputSchema } from "../../schemas/helius/searchAssets.schema";
import { baseProcedure } from "../base.procedure";

export const searchAssets = baseProcedure
  .input(searchAssetsInputSchema)
  .handler(async ({ input }) => {
    return await searchAssetsHandler(input);
  });
