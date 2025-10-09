import * as z from "zod";
import { quoteHandler } from "../../handlers/dex-gateway/quote.handler";
import { baseProcedure } from "../base.procedure";

const quoteInputSchema = z.object({
  $typeName: z
    .literal("darklake.v1.QuoteRequest")
    .default("darklake.v1.QuoteRequest"),
  amountIn: z.bigint(),
  isSwapXToY: z.boolean(),
  tokenMintX: z.string(),
  tokenMintY: z.string(),
});

export const quote = baseProcedure
  .input(quoteInputSchema)
  .handler(async ({ input }) => {
    return await quoteHandler(input);
  });
