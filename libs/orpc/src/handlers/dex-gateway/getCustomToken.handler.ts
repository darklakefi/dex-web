"use server";

import type {
  GetCustomTokenRequest,
  GetCustomTokenResponse,
} from "@dex-web/grpc-client";
import { ORPCError } from "@orpc/server";
import { getDexGatewayClient } from "../../dex-gateway";
import { LoggerService } from "../../services/LoggerService";
import { MonitoringService } from "../../services/MonitoringService";

const logger = LoggerService.getInstance();
const monitoring = MonitoringService.getInstance();

export async function getCustomTokenHandler(
  input: GetCustomTokenRequest,
): Promise<GetCustomTokenResponse> {
  const startTime = performance.now();
  try {
    logger.info("Starting getCustomToken request", {
      address: input.address,
    });

    const grpcClient = await getDexGatewayClient();
    const response = await grpcClient.getCustomToken(input);

    const duration = performance.now() - startTime;
    logger.info("GetCustomToken request completed", {
      duration,
      found: !!response.tokenMetadata,
    });

    monitoring.recordLatency("getCustomToken", duration, { success: "true" });
    monitoring.recordSuccess("getCustomToken");

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.errorWithStack("GetCustomToken gRPC call failed", error as Error, {
      address: input.address,
      duration,
    });

    monitoring.recordLatency("getCustomToken", duration, { success: "false" });

    if (error instanceof Error) {
      if (
        error.message.toLowerCase().includes("not found") ||
        error.message.toLowerCase().includes("does not exist")
      ) {
        monitoring.recordError("getCustomToken", "TOKEN_NOT_FOUND");
        throw new ORPCError("TOKEN_NOT_FOUND", {
          data: {
            address: input.address,
          },
          message: "Token not found",
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
