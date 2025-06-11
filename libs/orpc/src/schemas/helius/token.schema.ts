import z from "zod";

export const tokenSchema = z.object({
  description: z.string(),
  id: z.string(),
  image: z
    .object({
      url: z.string(),
    })
    .nullable(),
  name: z.string(),
  symbol: z.string(),
});

export type Token = z.infer<typeof tokenSchema>;
