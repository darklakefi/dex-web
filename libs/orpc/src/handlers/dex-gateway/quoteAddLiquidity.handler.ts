"use server";

import type {
  QuoteAddLiquidityRequest,
  QuoteAddLiquidityResponse,
} from "@dex-web/grpc-client";
import { ORPCError } from "@orpc/server";
import { getDexGatewayClient } from "../../dex-gateway";
import { LoggerService } from "../../services/LoggerService";
import { MonitoringService } from "../../services/MonitoringService";

const logger = LoggerService.getInstance();
const monitoring = MonitoringService.getInstance();

export async function quoteAddLiquidityHandler(
  input: QuoteAddLiquidityRequest,
): Promise<QuoteAddLiquidityResponse> {
  const startTime = performance.now();
  try {
    logger.info("Starting quoteAddLiquidity request", {
      slippageTolerance: input.slippageTolerance.toString(),
      tokenMintX: input.tokenMintX,
      tokenMintY: input.tokenMintY,
      tokenXAmount: input.tokenXAmount.toString(),
      tokenYAmount: input.tokenYAmount.toString(),
    });

    const grpcClient = await getDexGatewayClient();
    const response = await grpcClient.quoteAddLiquidity(input);

    const duration = performance.now() - startTime;
    logger.info("QuoteAddLiquidity request completed", {
      duration,
      lpTokenAmount: response.lpTokenAmount.toString(),
    });

    monitoring.recordLatency("quoteAddLiquidity", duration, {
      success: "true",
    });
    monitoring.recordSuccess("quoteAddLiquidity");

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.errorWithStack(
      "QuoteAddLiquidity gRPC call failed",
      error as Error,
      {
        duration,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined,
        input: {
          slippageTolerance: input.slippageTolerance.toString(),
          tokenMintX: input.tokenMintX,
          tokenMintY: input.tokenMintY,
          tokenXAmount: input.tokenXAmount.toString(),
          tokenYAmount: input.tokenYAmount.toString(),
        },
        tokenMintX: input.tokenMintX,
        tokenMintY: input.tokenMintY,
      },
    );

    monitoring.recordLatency("quoteAddLiquidity", duration, {
      success: "false",
    });

    if (error instanceof Error) {
      if (
        error.message.toLowerCase().includes("pool not found") ||
        error.message.toLowerCase().includes("no pool")
      ) {
        monitoring.recordError("quoteAddLiquidity", "POOL_NOT_FOUND");
        throw new ORPCError("POOL_NOT_FOUND", {
          data: {
            tokenX: input.tokenMintX,
            tokenY: input.tokenMintY,
          },
          message: "Pool not found for the specified token pair",
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
