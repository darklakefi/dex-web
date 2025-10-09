import { isSolanaAddress } from "@dex-web/utils";
import * as z from "zod";
import { deleteCustomTokenHandler } from "../../handlers/dex-gateway/deleteCustomToken.handler";
import { baseProcedure } from "../base.procedure";

const deleteCustomTokenInputSchema = z.object({
  $typeName: z
    .literal("darklake.v1.DeleteCustomTokenRequest")
    .default("darklake.v1.DeleteCustomTokenRequest"),
  address: z
    .string()
    .min(32, "Invalid Solana address")
    .max(44, "Invalid Solana address")
    .refine((addr) => isSolanaAddress(addr), {
      message: "Address must be a valid Solana address",
    }),
});

export const deleteCustomToken = baseProcedure
  .input(deleteCustomTokenInputSchema)
  .handler(async ({ input }) => {
    return await deleteCustomTokenHandler(input);
  });
