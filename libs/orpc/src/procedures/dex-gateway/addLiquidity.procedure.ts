import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
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
    // Normalize token order to match on-chain constraint: token_mint_x < token_mint_y
    let normalized = input;
    try {
      const x = new PublicKey(input.tokenMintX);
      const y = new PublicKey(input.tokenMintY);
      if (x.toBuffer().compare(y.toBuffer()) > 0) {
        // Swap mints and corresponding max amounts
        normalized = {
          ...input,
          maxAmountX: input.maxAmountY,
          maxAmountY: input.maxAmountX,
          tokenMintX: input.tokenMintY,
          tokenMintY: input.tokenMintX,
        };
        // eslint-disable-next-line no-console
        console.log("🔁 Normalized token order for addLiquidity:", {
          from: { tokenMintX: input.tokenMintX, tokenMintY: input.tokenMintY },
          to: {
            tokenMintX: normalized.tokenMintX,
            tokenMintY: normalized.tokenMintY,
          },
        });
      }
    } catch {
      // If keys invalid, handler will surface errors as usual
    }
    return await addLiquidityHandler(normalized);
  });
