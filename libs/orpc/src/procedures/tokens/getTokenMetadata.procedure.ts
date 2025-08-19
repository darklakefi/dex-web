import { getTokenMetadataHandler } from "../../handlers/tokens/getTokenMetadata.handler";
import { getTokenMetadataInputSchema } from "../../schemas/tokens/getTokenMetadata.schema";
import { baseProcedure } from "../base.procedure";

export const getTokenMetadata = baseProcedure
  .input(getTokenMetadataInputSchema)
  .handler(async ({ input }) => {
    return await getTokenMetadataHandler(input);
  });
