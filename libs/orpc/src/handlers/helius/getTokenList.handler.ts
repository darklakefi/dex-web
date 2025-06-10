import z from "zod";
import { helius } from "../../helius";

export const getTokenListInputSchema = z.object({
  input: z.object({
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
});

type GetTokenListInput = z.infer<typeof getTokenListInputSchema>;

export async function getTokenListHandler({ input }: GetTokenListInput) {
  return await helius.rpc.searchAssets({
    cursor: input.cursor,
    limit: input.limit,
  });
}
