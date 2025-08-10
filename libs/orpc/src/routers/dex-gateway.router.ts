import { checkTradeStatus } from "../procedures/dex-gateway/checkTradeStatus.procedure";
import { getSwap } from "../procedures/dex-gateway/getSwap.procedure";
import { getTradesListByUser } from "../procedures/dex-gateway/getTradesListByUser.procedure";
import { submitSignedTransaction } from "../procedures/dex-gateway/submitSignedTransaction.procedure";
import { addLiquidity } from "../procedures/pools/addLiquidityTx.procedure";
import { createPoolTx } from "../procedures/pools/createPoolTx.prodcedure";
import { getPoolDetails } from "../procedures/pools/getPoolDetail.procedure";
import { removeLiquidity } from "../procedures/pools/removeLiquidityTx.procedure";

export const dexGatewayRouter = {
  addLiquidity,
  checkTradeStatus,
  createPoolTx,
  getPoolDetails,
  getSwap,
  getTradesListByUser,
  removeLiquidity,
  submitSignedTransaction,
};

export type DexGatewayRouter = typeof dexGatewayRouter;
