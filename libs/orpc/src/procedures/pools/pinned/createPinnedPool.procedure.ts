import { createPinnedPoolHandler } from "../../../handlers/pools/pinned/createPinnedPool.handler";
import {
  createPinnedPoolInputSchema,
  createPinnedPoolOutputSchema,
} from "../../../schemas/pools/pinned/createPinnedPool.schema";
import { baseProcedure } from "../../base.procedure";

export const createPinnedPool = baseProcedure
  .input(createPinnedPoolInputSchema)
  .output(createPinnedPoolOutputSchema)
  .handler(async ({ input }) => {
    return await createPinnedPoolHandler(input);
  });
