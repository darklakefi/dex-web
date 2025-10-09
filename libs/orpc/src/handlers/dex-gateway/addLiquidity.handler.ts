"use server";
import type {
  AddLiquidityRequest,
  AddLiquidityResponse,
} from "@dex-web/grpc-client";
import { ORPCError } from "@orpc/server";
import { getDexGatewayClient } from "../../dex-gateway";
import { LoggerService } from "../../services/LoggerService";
import { MonitoringService } from "../../services/MonitoringService";
import { tryDecodeAddLiquidity } from "../../utils/decodeAddLiquidity";
import { deserializeVersionedTransaction } from "../../utils/solana";

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
    console.log("📤 Backend addLiquidity input:", {
      amountLp: input.amountLp.toString(),
      maxAmountX: input.maxAmountX.toString(),
      maxAmountY: input.maxAmountY.toString(),
      tokenMintX: input.tokenMintX,
      tokenMintY: input.tokenMintY,
    });
    const grpcClient = await getDexGatewayClient();

    // Temporary hack: gateway rotates (amountLp, maxX, maxY) => (maxY, amountLp, maxX)
    // Invert it here until gateway is fixed, then verify by decoding the txn
    const hackEnabled =
      process.env.ORPC_FIX_GATEWAY_ADD_LIQUIDITY_ROTATION !== "0";
    const rotatedInput: AddLiquidityRequest = hackEnabled
      ? {
          ...input,
          amountLp: input.maxAmountX,
          maxAmountX: input.maxAmountY,
          maxAmountY: input.amountLp,
        }
      : input;

    if (hackEnabled) {
      console.warn("Applying gateway rotation hack for addLiquidity args");
    }

    let response = await grpcClient.addLiquidity(rotatedInput);

    // Validate the unsigned txn encodes the intended args; if not, fallback to original
    try {
      if (response.unsignedTransaction) {
        const tx = deserializeVersionedTransaction(
          response.unsignedTransaction,
        );
        const ix0 = (tx.message as any).compiledInstructions?.[0];
        if (ix0?.data) {
          const decoded = tryDecodeAddLiquidity(
            Buffer.from(ix0.data, "base64"),
          );
          const ok =
            decoded &&
            decoded.amount_lp.toString() === input.amountLp.toString() &&
            decoded.max_amount_x.toString() === input.maxAmountX.toString() &&
            decoded.max_amount_y.toString() === input.maxAmountY.toString();
          if (!ok) {
            console.warn(
              "Gateway rotation hack validation failed; retrying without rotation",
              {
                decoded,
                expected: {
                  amount_lp: input.amountLp.toString(),
                  max_amount_x: input.maxAmountX.toString(),
                  max_amount_y: input.maxAmountY.toString(),
                },
              },
            );
            response = await grpcClient.addLiquidity(input);
          }
        }
      }
    } catch (e) {
      console.warn("Could not validate or decode unsigned transaction:", e);
    }
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
