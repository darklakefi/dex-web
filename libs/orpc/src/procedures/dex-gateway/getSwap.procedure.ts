import * as z from "zod";
import { getSwapHandler } from "../../handlers/dex-gateway/getSwap.handler";
import { baseProcedure } from "../base.procedure";

const getSwapInputSchema = z.object({
  $typeName: z
    .literal("darklake.v1.CreateUnsignedTransactionRequest")
    .default("darklake.v1.CreateUnsignedTransactionRequest"),
  amountIn: z.bigint(),
  isSwapXToY: z.boolean(),
  label: z.string().optional().default(""),
  minOut: z.bigint(),
  refCode: z.string().optional().default(""),
  tokenMintX: z.string(),
  tokenMintY: z.string(),
  trackingId: z.string(),
  userAddress: z.string(),
});

export const getSwap = baseProcedure
  .input(getSwapInputSchema)
  .handler(async ({ input }) => {
    return await getSwapHandler(input);
  });
