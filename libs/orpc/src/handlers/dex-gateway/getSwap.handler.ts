"use server";

import type { CreateUnsignedTransactionRequest } from "@dex-web/grpc-client";
import { getDexGatewayClient } from "../../dex-gateway";

export async function getSwapHandler(input: CreateUnsignedTransactionRequest) {
  try {
    const grpcClient = getDexGatewayClient();

    const amountInRaw = input.amountIn;
    const minOutRaw = input.minOut;

    const transactionRequest = {
      ...input,
      amountIn: amountInRaw,
      minOut: minOutRaw,
    };

    console.log("Creating unsigned transaction with:", {
      trackingId: transactionRequest.trackingId,
      amountIn: transactionRequest.amountIn.toString(),
      minOut: transactionRequest.minOut.toString(),
      tokenMintX: transactionRequest.tokenMintX,
      tokenMintY: transactionRequest.tokenMintY,
    });

    const swapResponse = await (
      await grpcClient
    ).createUnsignedTransaction(transactionRequest);

    return {
      success: true,
      trackingId: input.trackingId,
      tradeId: swapResponse.tradeId,
      unsignedTransaction: swapResponse.unsignedTransaction,
    };
  } catch (error) {
    console.error("Error calling dex-gateway swap:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      trackingId: input.trackingId,
    });
    return {
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
}
