import { checkTradeStatus } from "../procedures/dex-gateway/checkTradeStatus.procedure";
import { getSwap } from "../procedures/dex-gateway/getSwap.procedure";
import { getTradesListByUser } from "../procedures/dex-gateway/getTradesListByUser.procedure";
import { submitSignedTransaction } from "../procedures/dex-gateway/submitSignedTransaction.procedure";
import { addLiquidity } from "../procedures/pools/addLiquidityTx.procedure";
import { checkLiquidityTxStatus } from "../procedures/pools/checkLiquidityTxStatus.procedure";
import { createPoolTx } from "../procedures/pools/createPoolTx.prodcedure";
import { getPoolDetails } from "../procedures/pools/getPoolDetail.procedure";
import { removeLiquidity } from "../procedures/pools/removeLiquidityTx.procedure";
import { submitLiquidityTx } from "../procedures/pools/submitLiquidityTx.procedure";

export const dexGatewayRouter = {
  addLiquidity,
  checkLiquidityTxStatus,
  checkTradeStatus,
  createPoolTx,
  getPoolDetails,
  getSwap,
  getTradesListByUser,
  removeLiquidity,
  submitLiquidityTx,
  submitSignedTransaction,
};

export type DexGatewayRouter = typeof dexGatewayRouter;
