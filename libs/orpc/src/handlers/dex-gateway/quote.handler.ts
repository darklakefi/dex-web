"use server";

import type { QuoteRequest, QuoteResponse } from "@dex-web/grpc-client";
import { ORPCError } from "@orpc/server";
import { getDexGatewayClient } from "../../dex-gateway";
import { LoggerService } from "../../services/LoggerService";
import { MonitoringService } from "../../services/MonitoringService";

const logger = LoggerService.getInstance();
const monitoring = MonitoringService.getInstance();

export async function quoteHandler(
  input: QuoteRequest,
): Promise<QuoteResponse> {
  const startTime = performance.now();
  try {
    logger.info("Starting quote request", {
      amountIn: input.amountIn.toString(),
      isSwapXToY: input.isSwapXToY,
      tokenMintX: input.tokenMintX,
      tokenMintY: input.tokenMintY,
    });

    const grpcClient = await getDexGatewayClient();
    const response = await grpcClient.quote(input);

    const duration = performance.now() - startTime;
    logger.info("Quote request completed", {
      amountOut: response.amountOut.toString(),
      duration,
      feeAmount: response.feeAmount.toString(),
    });

    monitoring.recordLatency("quote", duration, { success: "true" });
    monitoring.recordSuccess("quote");

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.errorWithStack("Quote gRPC call failed", error as Error, {
      duration,
      tokenMintX: input.tokenMintX,
      tokenMintY: input.tokenMintY,
    });

    monitoring.recordLatency("quote", duration, { success: "false" });

    if (error instanceof Error) {
      if (
        error.message.toLowerCase().includes("pool not found") ||
        error.message.toLowerCase().includes("no pool")
      ) {
        monitoring.recordError("quote", "POOL_NOT_FOUND");
        throw new ORPCError("POOL_NOT_FOUND", {
          data: {
            tokenX: input.tokenMintX,
            tokenY: input.tokenMintY,
          },
          message: "Pool not found for the specified token pair",
        });
      }

      if (error.message.toLowerCase().includes("insufficient liquidity")) {
        monitoring.recordError("quote", "INSUFFICIENT_LIQUIDITY");
        throw new ORPCError("INSUFFICIENT_LIQUIDITY", {
          data: {
            amountIn: input.amountIn.toString(),
            tokenX: input.tokenMintX,
            tokenY: input.tokenMintY,
          },
          message: "Insufficient liquidity for this swap amount",
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

    throw new ORPCError("GRPC_ERROR", {
      data: {
        code: "UNKNOWN",
        details: error instanceof Error ? error.message : "Unknown error",
        retryable: true,
      },
      message: "External service error",
    });
  }
}
