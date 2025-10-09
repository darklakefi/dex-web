import { isSolanaAddress } from "@dex-web/utils";
import * as z from "zod";
import { editCustomTokenHandler } from "../../handlers/dex-gateway/editCustomToken.handler";
import { baseProcedure } from "../base.procedure";

const editCustomTokenInputSchema = z.object({
  $typeName: z
    .literal("darklake.v1.EditCustomTokenRequest")
    .default("darklake.v1.EditCustomTokenRequest"),
  address: z
    .string()
    .min(32, "Invalid Solana address")
    .max(44, "Invalid Solana address")
    .refine((addr) => isSolanaAddress(addr), {
      message: "Address must be a valid Solana address",
    }),
  decimals: z
    .number()
    .int("Decimals must be an integer")
    .min(0, "Decimals must be 0 or greater")
    .max(18, "Decimals must be 18 or less"),
  logoUri: z
    .string()
    .url("Logo URI must be a valid URL")
    .max(500, "Logo URI must be 500 characters or less")
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === "https:" || parsed.protocol === "http:";
        } catch {
          return false;
        }
      },
      { message: "Logo URI must use HTTP or HTTPS protocol" },
    ),
  name: z
    .string()
    .min(1, "Token name is required")
    .max(50, "Token name must be 50 characters or less"),
  symbol: z
    .string()
    .min(1, "Token symbol is required")
    .max(10, "Token symbol must be 10 characters or less")
    .regex(
      /^[A-Z0-9]+$/,
      "Token symbol must contain only uppercase letters and numbers",
    ),
});

export const editCustomToken = baseProcedure
  .input(editCustomTokenInputSchema)
  .handler(async ({ input }) => {
    return await editCustomTokenHandler(input);
  });
