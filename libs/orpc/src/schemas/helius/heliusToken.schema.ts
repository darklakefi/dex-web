import { z } from "zod";

export const heliusTokenSchema = z.object({
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

export type HeliusToken = z.infer<typeof heliusTokenSchema>;
