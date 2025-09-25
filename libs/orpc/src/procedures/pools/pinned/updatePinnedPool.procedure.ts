import { updatePinnedPoolHandler } from "../../../handlers/pools/pinned/updatePinnedPool.handler";
import {
  updatePinnedPoolInputSchema,
  updatePinnedPoolOutputSchema,
} from "../../../schemas/pools/pinned/updatePinnedPool.schema";
import { baseProcedure } from "../../base.procedure";

export const updatePinnedPool = baseProcedure
  .input(updatePinnedPoolInputSchema)
  .output(updatePinnedPoolOutputSchema)
  .handler(async ({ input }) => {
    return await updatePinnedPoolHandler(input);
  });
