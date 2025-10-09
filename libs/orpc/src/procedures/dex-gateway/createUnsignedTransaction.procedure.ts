import * as z from "zod";
import { createUnsignedTransactionHandler } from "../../handlers/dex-gateway/createUnsignedTransaction.handler";
import { baseProcedure } from "../base.procedure";

const createUnsignedTransactionInputSchema = z.object({
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

export const createUnsignedTransaction = baseProcedure
  .input(createUnsignedTransactionInputSchema)
  .handler(async ({ input }) => {
    return await createUnsignedTransactionHandler(input);
  });
