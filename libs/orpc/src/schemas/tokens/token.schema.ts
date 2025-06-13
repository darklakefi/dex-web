import z from "zod/v4";

export const tokenSchema = z.object({
  imageUrl: z.string().optional(),
  symbol: z.string(),
  value: z.string(),
});

export type Token = z.infer<typeof tokenSchema>;
