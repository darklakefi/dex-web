import { addLiquidity } from "../procedures/dex-gateway/addLiquidity.procedure";
import { checkTradeStatus } from "../procedures/dex-gateway/checkTradeStatus.procedure";
import { createCustomToken } from "../procedures/dex-gateway/createCustomToken.procedure";
import { createUnsignedTransaction } from "../procedures/dex-gateway/createUnsignedTransaction.procedure";
import { deleteCustomToken } from "../procedures/dex-gateway/deleteCustomToken.procedure";
import { editCustomToken } from "../procedures/dex-gateway/editCustomToken.procedure";
import { getCustomToken } from "../procedures/dex-gateway/getCustomToken.procedure";
import { getCustomTokens } from "../procedures/dex-gateway/getCustomTokens.procedure";
import { getTokenMetadata } from "../procedures/dex-gateway/getTokenMetadata.procedure";
import { getTokenMetadataList } from "../procedures/dex-gateway/getTokenMetadataList.procedure";
import { getTradesListByUser } from "../procedures/dex-gateway/getTradesListByUser.procedure";
import { getTransactionStatus } from "../procedures/dex-gateway/getTransactionStatus.procedure";
import { initPool } from "../procedures/dex-gateway/initPool.procedure";
import { quote } from "../procedures/dex-gateway/quote.procedure";
import { quoteAddLiquidity } from "../procedures/dex-gateway/quoteAddLiquidity.procedure";
import { removeLiquidity } from "../procedures/dex-gateway/removeLiquidity.procedure";
import { submitSignedTransaction } from "../procedures/dex-gateway/submitSignedTransaction.procedure";
export const dexGatewayRouter = {
  addLiquidity,
  checkTradeStatus,
  createCustomToken,
  createUnsignedTransaction,
  deleteCustomToken,
  editCustomToken,
  getCustomToken,
  getCustomTokens,
  getTokenMetadata,
  getTokenMetadataList,
  getTradesListByUser,
  getTransactionStatus,
  initPool,
  quote,
  quoteAddLiquidity,
  removeLiquidity,
  submitSignedTransaction,
};
export type DexGatewayRouter = typeof dexGatewayRouter;
