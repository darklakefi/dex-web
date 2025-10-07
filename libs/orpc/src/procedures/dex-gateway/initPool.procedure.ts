import { z } from "zod";
import { initPoolHandler } from "../../handlers/dex-gateway/initPool.handler";
import { baseProcedure } from "../base.procedure";

const initPoolInputSchema = z.object({
  $typeName: z
    .literal("darklake.v1.InitPoolRequest")
    .default("darklake.v1.InitPoolRequest"),
  amountX: z.bigint(),
  amountY: z.bigint(),
  label: z.string().optional().default(""),
  refCode: z.string().optional().default(""),
  tokenMintX: z.string(),
  tokenMintY: z.string(),
  userAddress: z.string(),
});
export const initPool = baseProcedure
  .input(initPoolInputSchema)
  .handler(async ({ input }) => {
    return await initPoolHandler(input);
  });
