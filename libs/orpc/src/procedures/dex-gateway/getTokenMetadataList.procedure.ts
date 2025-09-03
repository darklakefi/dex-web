import { getTokenMetadataListHandler } from "../../handlers/dex-gateway/getTokenMetadataList.handler";
import { getTokenMetadataListInputSchema } from "../../schemas/dex-gateway/getTokenMetadataList.schema";
import { baseProcedure } from "../base.procedure";

export const getTokenMetadataList = baseProcedure
  .input(getTokenMetadataListInputSchema)
  .handler(async ({ input }) => {
    return await getTokenMetadataListHandler(input);
  });
