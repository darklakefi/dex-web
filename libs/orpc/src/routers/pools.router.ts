import { createPoolTransaction } from "../procedures/pools/createPoolTransaction.procedure";
import { getLPRate } from "../procedures/pools/getLPRate.procedure";
import { getPinedPool } from "../procedures/pools/getPinedPool.procedure";
import { getPoolDetails } from "../procedures/pools/getPoolDetails.procedure";
import { getPoolReserves } from "../procedures/pools/getPoolReserves.procedure";

export const poolsRouter = {
  createPoolTransaction,
  getLPRate,
  getPinedPool,
  getPoolDetails,
  getPoolReserves,
};

export type PoolsRouter = typeof poolsRouter;
