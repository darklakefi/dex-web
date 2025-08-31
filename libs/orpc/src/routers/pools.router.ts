import { createPoolTransaction } from "../procedures/pools/createPoolTransaction.procedure";
import { getLPRate } from "../procedures/pools/getLPRate.procedure";
import { getPinedPool } from "../procedures/pools/getPinedPool.procedure";
import { getPoolDetails } from "../procedures/pools/getPoolDetails.procedure";
import { getPoolReserves } from "../procedures/pools/getPoolReserves.procedure";
import { createPinnedPool } from "../procedures/pools/pinned/createPinnedPool.procedure";
import { deletePinnedPool } from "../procedures/pools/pinned/deletePinnedPool.procedure";
import { listPinnedPools } from "../procedures/pools/pinned/listPinnedPools.procedure";
import { updatePinnedPool } from "../procedures/pools/pinned/updatePinnedPool.procedure";

export const poolsRouter = {
  createPinnedPool,
  createPoolTransaction,
  deletePinnedPool,
  getLPRate,
  getPinedPool,
  getPoolDetails,
  getPoolReserves,
  listPinnedPools,
  updatePinnedPool,
};

export type PoolsRouter = typeof poolsRouter;
