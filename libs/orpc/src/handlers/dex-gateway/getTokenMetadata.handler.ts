"use server";

import type {
  GetTokenMetadataRequest,
  GetTokenMetadataResponse,
} from "@dex-web/grpc-client";
import { ORPCError } from "@orpc/server";
import { getDexGatewayClient } from "../../dex-gateway";
import { LoggerService } from "../../services/LoggerService";
import { MonitoringService } from "../../services/MonitoringService";

const logger = LoggerService.getInstance();
const monitoring = MonitoringService.getInstance();

export async function getTokenMetadataHandler(
  input: GetTokenMetadataRequest,
): Promise<GetTokenMetadataResponse> {
  const startTime = performance.now();
  try {
    logger.info("Starting getTokenMetadata request", {
      searchBy: input.searchBy.case,
    });

    const grpcClient = await getDexGatewayClient();
    const response = await grpcClient.getTokenMetadata(input);

    const duration = performance.now() - startTime;
    logger.info("GetTokenMetadata request completed", {
      duration,
      found: !!response.tokenMetadata,
    });

    monitoring.recordLatency("getTokenMetadata", duration, {
      success: "true",
    });
    monitoring.recordSuccess("getTokenMetadata");

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.errorWithStack("GetTokenMetadata gRPC call failed", error as Error, {
      duration,
      searchBy: input.searchBy.case,
    });

    monitoring.recordLatency("getTokenMetadata", duration, {
      success: "false",
    });

    if (error instanceof Error) {
      if (
        error.message.toLowerCase().includes("not found") ||
        error.message.toLowerCase().includes("no token")
      ) {
        monitoring.recordError("getTokenMetadata", "TOKEN_NOT_FOUND");
        throw new ORPCError("TOKEN_NOT_FOUND", {
          data: {
            searchBy: input.searchBy.case,
          },
          message: "Token metadata not found",
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
