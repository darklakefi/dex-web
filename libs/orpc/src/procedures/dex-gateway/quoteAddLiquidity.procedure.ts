import * as z from "zod";
import { quoteAddLiquidityHandler } from "../../handlers/dex-gateway/quoteAddLiquidity.handler";
import { baseProcedure } from "../base.procedure";

const quoteAddLiquidityInputSchema = z.object({
  $typeName: z
    .literal("darklake.v1.QuoteAddLiquidityRequest")
    .default("darklake.v1.QuoteAddLiquidityRequest"),
  slippageTolerance: z.bigint(),
  tokenMintX: z.string(),
  tokenMintY: z.string(),
  tokenXAmount: z.bigint(),
  tokenYAmount: z.bigint(),
});

export const quoteAddLiquidity = baseProcedure
  .input(quoteAddLiquidityInputSchema)
  .handler(async ({ input }) => {
    return await quoteAddLiquidityHandler(input);
  });
