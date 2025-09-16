import { z } from "zod";
import { getTokenMetadataListHandler } from "../../handlers/dex-gateway/getTokenMetadataList.handler";
import { baseProcedure } from "../base.procedure";

const getTokenMetadataListInputSchema = z.object({
  filterBy: z
    .object({
      case: z.enum(["addressesList", "symbolsList"]),
      value: z.object({
        tokenAddresses: z.array(z.string()).optional(),
        tokenSymbols: z.array(z.string()).optional(),
      }),
    })
    .optional(),
  pageNumber: z.number().optional(),
  pageSize: z.number().optional(),
});

export const getTokenMetadataList = baseProcedure
  .input(getTokenMetadataListInputSchema)
  .handler(async ({ input }) => {
    return await getTokenMetadataListHandler(input);
  });
