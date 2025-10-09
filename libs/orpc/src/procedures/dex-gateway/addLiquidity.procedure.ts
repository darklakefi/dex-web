import * as z from "zod";
import { VALIDATION_CONFIG } from "../../config/constants";
import { addLiquidityHandler } from "../../handlers/dex-gateway/addLiquidity.handler";
import { liquidityRateLimitMiddleware } from "../../middleware/rateLimit.middleware";
import { baseProcedure } from "../base.procedure";

const solanaAddressSchema = z
  .string()
  .min(32)
  .max(44)
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid Solana address format");
const addLiquidityInputSchema = z.object({
  $typeName: z
    .literal("darklake.v1.AddLiquidityRequest")
    .default("darklake.v1.AddLiquidityRequest"),
  amountLp: z
    .bigint()
    .min(VALIDATION_CONFIG.MIN_AMOUNT)
    .max(VALIDATION_CONFIG.MAX_AMOUNT),
  label: z.string().max(100).optional().default(""),
  maxAmountX: z
    .bigint()
    .min(VALIDATION_CONFIG.MIN_AMOUNT)
    .max(VALIDATION_CONFIG.MAX_AMOUNT),
  maxAmountY: z
    .bigint()
    .min(VALIDATION_CONFIG.MIN_AMOUNT)
    .max(VALIDATION_CONFIG.MAX_AMOUNT),
  refCode: z.string().max(50).optional().default(""),
  tokenMintX: solanaAddressSchema,
  tokenMintY: solanaAddressSchema,
  userAddress: solanaAddressSchema,
});
export const addLiquidity = baseProcedure
  .use(liquidityRateLimitMiddleware)
  .input(addLiquidityInputSchema)
  .handler(async ({ input }) => {
    return await addLiquidityHandler(input);
  });
