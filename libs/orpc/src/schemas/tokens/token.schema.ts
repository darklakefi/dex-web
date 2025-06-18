import z from "zod/v4";

export const tokenSchema = z.object({
  address: z.string(),
  imageUrl: z.string().optional(),
  name: z.string().optional(),
  symbol: z.string(),
  value: z.string(),
});

export type Token = z.infer<typeof tokenSchema>;
