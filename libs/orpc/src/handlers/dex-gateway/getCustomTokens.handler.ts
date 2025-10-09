"use server";

import type {
  GetCustomTokensRequest,
  GetCustomTokensResponse,
} from "@dex-web/grpc-client";
import { ORPCError } from "@orpc/server";
import { getDexGatewayClient } from "../../dex-gateway";
import { LoggerService } from "../../services/LoggerService";
import { MonitoringService } from "../../services/MonitoringService";

const logger = LoggerService.getInstance();
const monitoring = MonitoringService.getInstance();

export async function getCustomTokensHandler(
  input: GetCustomTokensRequest,
): Promise<GetCustomTokensResponse> {
  const startTime = performance.now();
  try {
    logger.info("Starting getCustomTokens request");

    const grpcClient = await getDexGatewayClient();
    const response = await grpcClient.getCustomTokens(input);

    const duration = performance.now() - startTime;
    logger.info("GetCustomTokens request completed", {
      duration,
      tokenCount: response.tokens.length,
    });

    monitoring.recordLatency("getCustomTokens", duration, { success: "true" });
    monitoring.recordSuccess("getCustomTokens");

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.errorWithStack("GetCustomTokens gRPC call failed", error as Error, {
      duration,
    });

    monitoring.recordLatency("getCustomTokens", duration, {
      success: "false",
    });

    if (error instanceof Error) {
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
