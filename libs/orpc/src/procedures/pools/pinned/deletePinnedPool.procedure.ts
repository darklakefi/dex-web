import { deletePinnedPoolHandler } from "../../../handlers/pools/pinned/deletePinnedPool.handler";
import {
  deletePinnedPoolInputSchema,
  deletePinnedPoolOutputSchema,
} from "../../../schemas/pools/pinned/deletePinnedPool.schema";
import { baseProcedure } from "../../base.procedure";

export const deletePinnedPool = baseProcedure
  .input(deletePinnedPoolInputSchema)
  .output(deletePinnedPoolOutputSchema)
  .handler(async ({ input }) => {
    return await deletePinnedPoolHandler(input);
  });
