import { z } from "zod";
import { getTokenMetadataListHandler } from "../../handlers/dex-gateway/getTokenMetadataList.handler";
import { baseProcedure } from "../base.procedure";

const getTokenMetadataListInputSchema = z.object({
  $typeName: z
    .literal("darklake.v1.GetTokenMetadataListRequest")
    .default("darklake.v1.GetTokenMetadataListRequest"),
  filterBy: z.discriminatedUnion("case", [
    z.object({
      case: z.literal("addressesList"),
      value: z.object({
        $typeName: z.literal("darklake.v1.TokenAddressesList"),
        tokenAddresses: z.array(z.string()),
      }),
    }),
    z.object({
      case: z.literal("symbolsList"),
      value: z.object({
        $typeName: z.literal("darklake.v1.TokenSymbolsList"),
        tokenSymbols: z.array(z.string()),
      }),
    }),
    z.object({
      case: z.literal("namesList"),
      value: z.object({
        $typeName: z.literal("darklake.v1.TokenNamesList"),
        tokenNames: z.array(z.string()),
      }),
    }),
    z.object({
      case: z.literal("substring"),
      value: z.string(),
    }),
  ]),
  pageNumber: z.number(),
  pageSize: z.number(),
});

export const getTokenMetadataList = baseProcedure
  .input(getTokenMetadataListInputSchema)
  .handler(async ({ input }) => {
    return await getTokenMetadataListHandler(input);
  });
