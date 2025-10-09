import * as z from "zod";
import { getTokenMetadataHandler } from "../../handlers/dex-gateway/getTokenMetadata.handler";
import { baseProcedure } from "../base.procedure";

const getTokenMetadataInputSchema = z.object({
  $typeName: z
    .literal("darklake.v1.GetTokenMetadataRequest")
    .default("darklake.v1.GetTokenMetadataRequest"),
  searchBy: z.union([
    z.object({
      case: z.literal("tokenAddress"),
      value: z.string(),
    }),
    z.object({
      case: z.literal("tokenSymbol"),
      value: z.string(),
    }),
    z.object({
      case: z.literal("tokenName"),
      value: z.string(),
    }),
    z.object({
      case: z.literal("substring"),
      value: z.string(),
    }),
    z.object({
      case: z.literal(undefined),
      value: z.undefined().optional(),
    }),
  ]),
});

export const getTokenMetadata = baseProcedure
  .input(getTokenMetadataInputSchema)
  .handler(async ({ input }) => {
    return await getTokenMetadataHandler(input);
  });
