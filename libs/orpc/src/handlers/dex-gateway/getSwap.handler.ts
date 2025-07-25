"use server";

import { getDexGatewayClient } from "../../dex-gateway";
import type { SwapRequest, SwapResponse } from "../../dex-gateway.type";

export async function getSwapHandler(input: SwapRequest) {
  try {
    // Get the client
    const grpcClient = getDexGatewayClient();

    // for testing
    input.token_mint_x = "DPFczWRUhvXK3F3kZ3qFiQCcoFjo7VHEjL6RK5wKEiVx";
    input.token_mint_y = "DPFczWRUhvXK3F3kZ3qFiQCcoFjo7VHEjL6RK5wKEiVx";
    input.amount_in = 1000;
    input.min_out = 10;
    input.is_swap_x_to_y = true;

    input.tracking_id = "id" + Math.random().toString(16).slice(2);

    const swapResponse: SwapResponse = await grpcClient.swap(input);

    return {
      success: true,
      trackingId: input.tracking_id,
      tradeId: swapResponse.trade_id,
      unsignedTransaction: swapResponse.unsigned_transaction,
    };
  } catch (error) {
    console.error("Error calling dex-gateway swap:", error);
    return {
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
}
