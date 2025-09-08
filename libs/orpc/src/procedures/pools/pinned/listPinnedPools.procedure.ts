import { listPinnedPoolsHandler } from "../../../handlers/pools/pinned/listPinnedPools.handler";
import { listPinnedPoolsOutputSchema } from "../../../schemas/pools/pinned/listPinnedPools.schema";
import { baseProcedure } from "../../base.procedure";

export const listPinnedPools = baseProcedure
  .output(listPinnedPoolsOutputSchema)
  .handler(async () => {
    return await listPinnedPoolsHandler();
  });
