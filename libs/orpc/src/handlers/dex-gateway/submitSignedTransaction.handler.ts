"use server";

import { getDexGatewayClient } from "../../dex-gateway";
import type {
  SignedTransactionRequest,
  SignedTransactionResponse,
} from "../../dex-gateway.type";

export async function submitSignedTransactionHandler(
  input: SignedTransactionRequest,
) {
  const grpcClient = getDexGatewayClient();
  const response: SignedTransactionResponse =
    await grpcClient.submitSignedTransaction(input);
  return response;
}
