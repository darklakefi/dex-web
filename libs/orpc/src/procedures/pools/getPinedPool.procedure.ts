import { getPinedPoolHandler } from "../../handlers/pools/getPinedPool.handler";
import { baseProcedure } from "../base.procedure";

export const getPinedPool = baseProcedure.handler(async () => {
  return await getPinedPoolHandler();
});
