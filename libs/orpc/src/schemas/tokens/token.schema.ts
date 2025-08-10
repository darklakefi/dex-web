import z from "zod/v4";

export const tokenSchema = z.object({
  address: z.string(),
  decimals: z.number().int().min(0),
  imageUrl: z.string().optional(),
  name: z.string().optional(),
  symbol: z.string(),
  value: z.string().optional(),
});

export type Token = z.infer<typeof tokenSchema>;
