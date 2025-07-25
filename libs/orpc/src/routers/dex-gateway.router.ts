import { getSwap } from "../procedures/dex-gateway/getSwap.procedure";
import { submitSignedTransaction } from "../procedures/dex-gateway/submitSignedTransaction.procedure";

export const dexGatewayRouter = {
  getSwap,
  submitSignedTransaction,
};

export type DexGatewayRouter = typeof dexGatewayRouter;
