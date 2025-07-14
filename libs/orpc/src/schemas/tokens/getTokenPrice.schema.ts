import { z } from "zod/v4";

export const quoteCurrencySchema = z.enum(["USD"]);

export const getTokenPriceInputSchema = z
  .object({
    amount: z.number().nonnegative(),
    mint: z.string(),
    quoteCurrency: quoteCurrencySchema,
  })
  .strict();

export const getTokenPriceOutputSchema = z.object({
  mint: z.string(),
  price: z.number().nonnegative(),
  quoteCurrency: quoteCurrencySchema,
});

export type GetTokenPriceInput = z.infer<typeof getTokenPriceInputSchema>;
export type GetTokenPriceOutput = z.infer<typeof getTokenPriceOutputSchema>;
