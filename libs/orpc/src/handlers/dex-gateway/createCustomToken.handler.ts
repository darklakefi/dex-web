"use server";

import type {
  CreateCustomTokenRequest,
  CreateCustomTokenResponse,
} from "@dex-web/grpc-client";
import { ORPCError } from "@orpc/server";
import { getDexGatewayClient } from "../../dex-gateway";
import { LoggerService } from "../../services/LoggerService";
import { MonitoringService } from "../../services/MonitoringService";

const logger = LoggerService.getInstance();
const monitoring = MonitoringService.getInstance();

export async function createCustomTokenHandler(
  input: CreateCustomTokenRequest,
): Promise<CreateCustomTokenResponse> {
  const startTime = performance.now();
  try {
    logger.info("Starting createCustomToken request", {
      address: input.address,
      decimals: input.decimals,
      name: input.name,
      symbol: input.symbol,
    });

    const grpcClient = await getDexGatewayClient();
    const response = await grpcClient.createCustomToken(input);

    const duration = performance.now() - startTime;
    logger.info("CreateCustomToken request completed", {
      duration,
      success: response.success,
    });

    monitoring.recordLatency("createCustomToken", duration, {
      success: "true",
    });
    monitoring.recordSuccess("createCustomToken");

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;
    logger.errorWithStack(
      "CreateCustomToken gRPC call failed",
      error as Error,
      {
        address: input.address,
        duration,
      },
    );

    monitoring.recordLatency("createCustomToken", duration, {
      success: "false",
    });

    if (error instanceof Error) {
      if (
        error.message.toLowerCase().includes("already exists") ||
        error.message.toLowerCase().includes("duplicate")
      ) {
        monitoring.recordError("createCustomToken", "TOKEN_ALREADY_EXISTS");
        throw new ORPCError("TOKEN_ALREADY_EXISTS", {
          data: {
            address: input.address,
          },
          message: "Token already exists",
        });
      }

      if (
        error.message.toLowerCase().includes("invalid address") ||
        error.message.toLowerCase().includes("invalid token")
      ) {
        monitoring.recordError("createCustomToken", "INVALID_ADDRESS");
        throw new ORPCError("INVALID_ADDRESS", {
          data: {
            address: input.address,
          },
          message: "Invalid token address",
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
