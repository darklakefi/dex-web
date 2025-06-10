import z from "zod";
import { helius } from "../../../helius";

export const searchAssetsInputSchema = z.object({
  input: z.object({
    limit: z.number().int().min(1).max(100).optional(),
    cursor: z.string().optional(),
  }),
});

type SearchAssetsInput = z.infer<typeof searchAssetsInputSchema>;

export async function searchAssetsHandler({ input }: SearchAssetsInput) {
  return await helius.rpc.searchAssets({
    limit: input.limit,
    cursor: input.cursor,
  });
}
