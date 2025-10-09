import { isSolanaAddress } from "@dex-web/utils";
import * as z from "zod";
import { createCustomTokenHandler } from "../../handlers/dex-gateway/createCustomToken.handler";
import { baseProcedure } from "../base.procedure";

const createCustomTokenInputSchema = z.object({
  $typeName: z
    .literal("darklake.v1.CreateCustomTokenRequest")
    .default("darklake.v1.CreateCustomTokenRequest"),
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

export const createCustomToken = baseProcedure
  .input(createCustomTokenInputSchema)
  .handler(async ({ input }) => {
    return await createCustomTokenHandler(input);
  });
