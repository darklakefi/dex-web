import z from "zod";
import { getTokenListHandler } from "../../handlers/helius/getTokenList.handler";
import { baseProcedure } from "../baseProcedure";

const getTokenListInputSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const getTokenList = baseProcedure
  .input(getTokenListInputSchema)
  .handler(async ({ input }) => {
    return await getTokenListHandler({ input });
  });
