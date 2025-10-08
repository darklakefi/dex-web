import { addLiquidity } from "../procedures/dex-gateway/addLiquidity.procedure";
import { checkTradeStatus } from "../procedures/dex-gateway/checkTradeStatus.procedure";
import { getSwap } from "../procedures/dex-gateway/getSwap.procedure";
import { getTokenMetadataList } from "../procedures/dex-gateway/getTokenMetadataList.procedure";
import { getTradesListByUser } from "../procedures/dex-gateway/getTradesListByUser.procedure";
import { getTransactionStatus } from "../procedures/dex-gateway/getTransactionStatus.procedure";
import { initPool } from "../procedures/dex-gateway/initPool.procedure";
import { removeLiquidity } from "../procedures/dex-gateway/removeLiquidity.procedure";
import { submitSignedTransaction } from "../procedures/dex-gateway/submitSignedTransaction.procedure";
export const dexGatewayRouter = {
  addLiquidity,
  checkTradeStatus,
  getSwap,
  getTokenMetadataList,
  getTradesListByUser,
  getTransactionStatus,
  initPool,
  removeLiquidity,
  submitSignedTransaction,
};
export type DexGatewayRouter = typeof dexGatewayRouter;
