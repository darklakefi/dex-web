import { checkTradeStatus } from "../procedures/dex-gateway/checkTradeStatus.procedure";
import { createCustomToken } from "../procedures/dex-gateway/custom-tokens/createCustomToken.procedure";
import { deleteCustomToken } from "../procedures/dex-gateway/custom-tokens/deleteCustomToken.procedure";
import { editCustomToken } from "../procedures/dex-gateway/custom-tokens/editCustomToken.procedure";
import { getCustomToken } from "../procedures/dex-gateway/custom-tokens/getCustomToken.procedure";
import { getCustomTokens } from "../procedures/dex-gateway/custom-tokens/getCustomTokens.procedure";
import { getSwap } from "../procedures/dex-gateway/getSwap.procedure";
import { getTokenMetadataList } from "../procedures/dex-gateway/getTokenMetadataList.procedure";
import { getTradesListByUser } from "../procedures/dex-gateway/getTradesListByUser.procedure";
import { submitSignedTransaction } from "../procedures/dex-gateway/submitSignedTransaction.procedure";

export const dexGatewayRouter = {
  checkTradeStatus,
  createCustomToken,
  deleteCustomToken,
  editCustomToken,
  getCustomToken,
  getCustomTokens,
  getSwap,
  getTokenMetadataList,
  getTradesListByUser,
  submitSignedTransaction,
};

export type DexGatewayRouter = typeof dexGatewayRouter;
