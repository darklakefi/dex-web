import z from "zod";
import { helius } from "../../../helius";

export const searchAssetsInputSchema = z.object({
  input: z.object({
    cursor: z.string().optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
});

type SearchAssetsInput = z.infer<typeof searchAssetsInputSchema>;

export async function searchAssetsHandler({ input }: SearchAssetsInput) {
  return await helius.rpc.searchAssets({
    cursor: input.cursor,
    limit: input.limit,
  });
}
