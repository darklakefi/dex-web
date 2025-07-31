import { checkTradeStatus } from "../procedures/dex-gateway/checkTradeStatus.procedure";
import { getSwap } from "../procedures/dex-gateway/getSwap.procedure";
import { submitSignedTransaction } from "../procedures/dex-gateway/submitSignedTransaction.procedure";

export const dexGatewayRouter = {
  checkTradeStatus,
  getSwap,
  submitSignedTransaction,
};

export type DexGatewayRouter = typeof dexGatewayRouter;
