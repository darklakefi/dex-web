import { z } from "zod";
import { getTokenMetadataListHandler } from "../../handlers/dex-gateway/getTokenMetadataList.handler";
import { baseProcedure } from "../base.procedure";

const getTokenMetadataListInputSchema = z.object({
	filterBy: z.discriminatedUnion("case", [
		z.object({
			case: z.literal("addressesList"),
			value: z.object({
				tokenAddresses: z.array(z.string()),
				$typeName: z.literal("darklake.v1.TokenAddressesList"),
			}),
		}),
		z.object({
			case: z.literal("symbolsList"),
			value: z.object({
				tokenSymbols: z.array(z.string()),
				$typeName: z.literal("darklake.v1.TokenSymbolsList"),
			}),
		}),
		z.object({
			case: z.literal("namesList"),
			value: z.object({
				tokenNames: z.array(z.string()),
				$typeName: z.literal("darklake.v1.TokenNamesList"),
			}),
		}),
		z.object({
			case: z.literal("substring"),
			value: z.string(),
		}),
	]),
	pageNumber: z.number(),
	pageSize: z.number(),
	$typeName: z
		.literal("darklake.v1.GetTokenMetadataListRequest")
		.default("darklake.v1.GetTokenMetadataListRequest"),
});

export const getTokenMetadataList = baseProcedure
	.input(getTokenMetadataListInputSchema)
	.handler(async ({ input }) => {
		return await getTokenMetadataListHandler(input);
	});
