"use server";

import type {
  EditCustomTokenRequest,
  EditCustomTokenResponse,
} from "@dex-web/grpc-client";
import { ORPCError } from "@orpc/server";
import { getDexGatewayClient } from "../../dex-gateway";
import { LoggerService } from "../../services/LoggerService";
import { MonitoringService } from "../../services/MonitoringService";

const logger = LoggerService.getInstance();
const monitoring = MonitoringService.getInstance();

export async function editCustomTokenHandler(
  input: EditCustomTokenRequest,
): Promise<EditCustomTokenResponse> {
  const startTime = performance.now();
  try {
    logger.info("Starting editCustomToken request", {
      address: input.address,
      decimals: input.decimals,
      name: input.name,
      symbol: input.symbol,
    });

    const grpcClient = await getDexGatewayClient();
    const response = await grpcClient.editCustomToken(input);

    const duration = performance.now() - startTime;
    logger.info("EditCustomToken request completed", {
      duration,
      success: response.success,
    });

    monitoring.recordLatency("editCustomToken", duration, { success: "true" });
    monitoring.recordSuccess("editCustomToken");

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.errorWithStack("EditCustomToken gRPC call failed", error as Error, {
      address: input.address,
      duration,
    });

    monitoring.recordLatency("editCustomToken", duration, {
      success: "false",
    });

    if (error instanceof Error) {
      if (
        error.message.toLowerCase().includes("not found") ||
        error.message.toLowerCase().includes("does not exist")
      ) {
        monitoring.recordError("editCustomToken", "TOKEN_NOT_FOUND");
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
