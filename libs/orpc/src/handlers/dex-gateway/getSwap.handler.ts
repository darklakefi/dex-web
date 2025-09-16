"use server";

import type { PartialMessage } from "@bufbuild/protobuf";
import type { CreateUnsignedTransactionRequestPB } from "@dex-web/grpc-client";
import { getDexGatewayClient } from "../../dex-gateway";
import type { Token } from "../../schemas/tokens/token.schema";
import { toRawUnits } from "../../utils/solana";
import { getTokenMetadataHandler } from "../tokens/getTokenMetadata.handler";

export async function getSwapHandler(input: PartialMessage<CreateUnsignedTransactionRequestPB>) {
  try {
    const grpcClient = getDexGatewayClient();

    const { isSwapXToY } = input;
    
    if (!input.tokenMintX || !input.tokenMintY) {
      throw new Error('Token mint addresses are required');
    }

    const tokenMetadata = (await getTokenMetadataHandler({
      addresses: [input.tokenMintX, input.tokenMintY],
      returnAsObject: true,
    })) as Record<string, Token>;

    const tokenX = tokenMetadata[input.tokenMintX];
    const tokenY = tokenMetadata[input.tokenMintY];

    let amountInDecimals = tokenX?.decimals ?? 0;
    let minOutDecimals = tokenY?.decimals ?? 0;

    if (!isSwapXToY) {
      [amountInDecimals, minOutDecimals] = [minOutDecimals, amountInDecimals];
    }

    input.amountIn = BigInt(toRawUnits(Number(input.amountIn), amountInDecimals).toFixed(0));
    input.minOut = BigInt(toRawUnits(Number(input.minOut), minOutDecimals).toFixed(0));

    const swapResponse = await grpcClient.createUnsignedTransaction(input);

    return {
      success: true,
      trackingId: input.trackingId,
      tradeId: swapResponse.tradeId,
      unsignedTransaction: swapResponse.unsignedTransaction,
    };
  } catch (error) {
    console.error("Error calling dex-gateway swap:", error);
    return {
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
}
