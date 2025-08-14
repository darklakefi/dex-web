import { checkTradeStatus } from "../procedures/dex-gateway/checkTradeStatus.procedure";
import { getSwap } from "../procedures/dex-gateway/getSwap.procedure";
import { getTokenMetadataList } from "../procedures/dex-gateway/getTokenMetadataList.procedure";
import { getTradesListByUser } from "../procedures/dex-gateway/getTradesListByUser.procedure";
import { submitSignedTransaction } from "../procedures/dex-gateway/submitSignedTransaction.procedure";

export const dexGatewayRouter = {
  checkTradeStatus,
  getSwap,
  getTokenMetadataList,
  getTradesListByUser,
  submitSignedTransaction,
};

export type DexGatewayRouter = typeof dexGatewayRouter;
