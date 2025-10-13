"use server";
import type {
  AddLiquidityRequest,
  AddLiquidityResponse,
} from "@dex-web/grpc-client";
import { ORPCError } from "@orpc/server";
import {
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { getDexGatewayClient } from "../../dex-gateway";
import { getHelius } from "../../getHelius";
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

    if (response.unsignedTransaction) {
      const userPubkey = new PublicKey(input.userAddress);
      const tokenXMint = new PublicKey(input.tokenMintX);
      const tokenYMint = new PublicKey(input.tokenMintY);

      const needsWrapX = tokenXMint.equals(NATIVE_MINT);
      const needsWrapY = tokenYMint.equals(NATIVE_MINT);

      if (needsWrapX || needsWrapY) {
        const helius = getHelius();
        const connection = helius.connection;

        const txBuffer = Buffer.from(response.unsignedTransaction, "base64");
        const tx = VersionedTransaction.deserialize(txBuffer);
        const message = TransactionMessage.decompile(tx.message);

        const wrapInstructions = [];

        if (needsWrapX) {
          const wsolAccount = getAssociatedTokenAddressSync(
            NATIVE_MINT,
            userPubkey,
            true,
            TOKEN_PROGRAM_ID,
          );
          wrapInstructions.push(
            SystemProgram.transfer({
              fromPubkey: userPubkey,
              lamports: input.maxAmountX,
              toPubkey: wsolAccount,
            }),
            createSyncNativeInstruction(wsolAccount),
          );
        }

        if (needsWrapY) {
          const wsolAccount = getAssociatedTokenAddressSync(
            NATIVE_MINT,
            userPubkey,
            true,
            TOKEN_PROGRAM_ID,
          );
          wrapInstructions.push(
            SystemProgram.transfer({
              fromPubkey: userPubkey,
              lamports: input.maxAmountY,
              toPubkey: wsolAccount,
            }),
            createSyncNativeInstruction(wsolAccount),
          );
        }

        message.instructions = [...wrapInstructions, ...message.instructions];

        const { blockhash } = await connection.getLatestBlockhash();
        message.recentBlockhash = blockhash;

        const newTx = new VersionedTransaction(message.compileToV0Message());
        response.unsignedTransaction = Buffer.from(newTx.serialize()).toString(
          "base64",
        );
      }
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
