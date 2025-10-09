import { isSolanaAddress } from "@dex-web/utils";
import * as z from "zod";
import { getCustomTokenHandler } from "../../handlers/dex-gateway/getCustomToken.handler";
import { baseProcedure } from "../base.procedure";

const getCustomTokenInputSchema = z.object({
  $typeName: z
    .literal("darklake.v1.GetCustomTokenRequest")
    .default("darklake.v1.GetCustomTokenRequest"),
  address: z
    .string()
    .min(32, "Invalid Solana address")
    .max(44, "Invalid Solana address")
    .refine((addr) => isSolanaAddress(addr), {
      message: "Address must be a valid Solana address",
    }),
});

export const getCustomToken = baseProcedure
  .input(getCustomTokenInputSchema)
  .handler(async ({ input }) => {
    return await getCustomTokenHandler(input);
  });
