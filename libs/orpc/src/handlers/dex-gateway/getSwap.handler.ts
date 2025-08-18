"use server";

import { getDexGatewayClient } from "../../dex-gateway";
import type { SwapRequest, SwapResponse } from "../../dex-gateway.type";
import { toRawUnits } from "../../utils/solana";
import { getTokenDetailsHandler } from "../tokens/getTokenDetails.handler";

export async function getSwapHandler(input: SwapRequest) {
  try {
    const grpcClient = getDexGatewayClient();

    const { is_swap_x_to_y } = input;

    const tokenX = await getTokenDetailsHandler({
      address: input.token_mint_x,
    });
    const tokenY = await getTokenDetailsHandler({
      address: input.token_mint_y,
    });

    let amountInDecimals = tokenX.decimals;
    let minOutDecimals = tokenY.decimals;

    if (!is_swap_x_to_y) {
      [amountInDecimals, minOutDecimals] = [minOutDecimals, amountInDecimals];
    }

    input.amount_in = toRawUnits(input.amount_in, amountInDecimals).toNumber();
    input.min_out = toRawUnits(input.min_out, minOutDecimals).toNumber();

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
