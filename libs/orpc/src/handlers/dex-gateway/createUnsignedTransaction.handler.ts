"use server";

import type { CreateUnsignedTransactionRequest } from "@dex-web/grpc-client";
import { ORPCError } from "@orpc/server";
import { getDexGatewayClient } from "../../dex-gateway";
import { LoggerService } from "../../services/LoggerService";
import { MonitoringService } from "../../services/MonitoringService";

const logger = LoggerService.getInstance();
const monitoring = MonitoringService.getInstance();

export async function createUnsignedTransactionHandler(
  input: CreateUnsignedTransactionRequest,
) {
  const startTime = performance.now();
  try {
    logger.info("Starting createUnsignedTransaction request", {
      amountIn: input.amountIn.toString(),
      isSwapXToY: input.isSwapXToY,
      minOut: input.minOut.toString(),
      tokenMintX: input.tokenMintX,
      tokenMintY: input.tokenMintY,
      trackingId: input.trackingId,
      userAddress: input.userAddress,
    });

    const grpcClient = await getDexGatewayClient();
    const response = await grpcClient.createUnsignedTransaction(input);

    const duration = performance.now() - startTime;
    logger.info("CreateUnsignedTransaction request completed", {
      duration,
      orderId: response.orderId,
      tradeId: response.tradeId,
    });

    monitoring.recordLatency("createUnsignedTransaction", duration, {
      success: "true",
    });
    monitoring.recordSuccess("createUnsignedTransaction");

    return {
      orderId: response.orderId,
      refCode: response.refCode,
      success: true,
      trackingId: input.trackingId,
      tradeId: response.tradeId,
      unsignedTransaction: response.unsignedTransaction,
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.errorWithStack(
      "CreateUnsignedTransaction gRPC call failed",
      error as Error,
      {
        duration,
        tokenMintX: input.tokenMintX,
        tokenMintY: input.tokenMintY,
        trackingId: input.trackingId,
      },
    );

    monitoring.recordLatency("createUnsignedTransaction", duration, {
      success: "false",
    });

    if (error instanceof Error) {
      if (
        error.message.toLowerCase().includes("pool not found") ||
        error.message.toLowerCase().includes("no pool")
      ) {
        monitoring.recordError("createUnsignedTransaction", "POOL_NOT_FOUND");
        throw new ORPCError("POOL_NOT_FOUND", {
          data: {
            tokenX: input.tokenMintX,
            tokenY: input.tokenMintY,
          },
          message: "Pool not found for the specified token pair",
        });
      }

      if (
        error.message.toLowerCase().includes("insufficient") ||
        error.message.toLowerCase().includes("balance")
      ) {
        monitoring.recordError(
          "createUnsignedTransaction",
          "INSUFFICIENT_BALANCE",
        );
        throw new ORPCError("INSUFFICIENT_BALANCE", {
          data: {
            amountIn: input.amountIn.toString(),
            tokenX: input.tokenMintX,
          },
          message: "Insufficient balance for this transaction",
        });
      }

      if (
        error.message.includes("network") ||
        error.message.includes("timeout")
      ) {
        throw new ORPCError("NETWORK_ERROR", {
          data: {
            endpoint: "dex-gateway",
            retryable: true,
          },
          message: "Network connection error",
        });
      }
    }

    return {
      error: error instanceof Error ? error.message : String(error),
      success: false,
    };
  }
}
