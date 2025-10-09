"use server";
import type {
  AddLiquidityRequest,
  AddLiquidityResponse,
} from "@dex-web/grpc-client";
import { ORPCError } from "@orpc/server";
import { getDexGatewayClient } from "../../dex-gateway";
import { LoggerService } from "../../services/LoggerService";
import { MonitoringService } from "../../services/MonitoringService";

const logger = LoggerService.getInstance();
const monitoring = MonitoringService.getInstance();
export async function addLiquidityHandler(
  input: AddLiquidityRequest,
): Promise<AddLiquidityResponse> {
  const startTime = performance.now();
  try {
    logger.info("Starting addLiquidity request", {
      amountLp: input.amountLp.toString(),
      maxAmountX: input.maxAmountX.toString(),
      maxAmountY: input.maxAmountY.toString(),
      tokenMintX: input.tokenMintX,
      tokenMintY: input.tokenMintY,
      userAddress: input.userAddress,
    });

    const grpcClient = await getDexGatewayClient();
    const response = await grpcClient.addLiquidity(input);
    const duration = performance.now() - startTime;
    logger.info("AddLiquidity request completed", {
      duration,
      success: !!response.unsignedTransaction,
    });
    monitoring.recordLatency("addLiquidity", duration, {
      success: "true",
      userAddress: input.userAddress,
    });
    monitoring.recordSuccess("addLiquidity", {
      userAddress: input.userAddress,
    });
    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.errorWithStack("AddLiquidity gRPC call failed", error as Error, {
      duration,
      tokenMintX: input.tokenMintX,
      tokenMintY: input.tokenMintY,
      userAddress: input.userAddress,
    });
    monitoring.recordLatency("addLiquidity", duration, {
      success: "false",
      userAddress: input.userAddress,
    });
    if (error instanceof Error) {
      if (error.message.includes("insufficient")) {
        monitoring.recordError("addLiquidity", "INSUFFICIENT_LIQUIDITY", {
          userAddress: input.userAddress,
        });
        throw new ORPCError("INSUFFICIENT_LIQUIDITY", {
          data: {
            available: "0",
            requested: input.amountLp.toString(),
            token: input.tokenMintX,
          },
          message: "Insufficient liquidity for this operation",
        });
      }
      if (error.message.toLowerCase().includes("pool not found")) {
        throw new ORPCError("POOL_NOT_FOUND", {
          data: {
            tokenX: input.tokenMintX,
            tokenY: input.tokenMintY,
          },
          message: "Pool not found for the specified tokens",
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
