import { z } from "zod";
import { removeLiquidityHandler } from "../../handlers/dex-gateway/removeLiquidity.handler";
import { baseProcedure } from "../base.procedure";

const removeLiquidityInputSchema = z.object({
  $typeName: z
    .literal("darklake.v1.RemoveLiquidityRequest")
    .default("darklake.v1.RemoveLiquidityRequest"),
  amountLp: z.bigint(),
  label: z.string().optional().default(""),
  minAmountX: z.bigint(),
  minAmountY: z.bigint(),
  refCode: z.string().optional().default(""),
  tokenMintX: z.string(),
  tokenMintY: z.string(),
  userAddress: z.string(),
});

export const removeLiquidity = baseProcedure
  .input(removeLiquidityInputSchema)
  .handler(async ({ input }) => {
    return await removeLiquidityHandler(input);
  });
