"use server";

import { serverClient } from "@dex-web/orpc/serverClient";
import type { CreateLiquidityTransactionInput } from "@dex-web/orpc/schemas";
import { parseAmount, sortSolanaAddresses } from "@dex-web/utils";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

// Form validation schema for Server Action
const liquidityFormSchema = z.object({
  tokenAAmount: z.string().min(1, "Token A amount is required"),
  tokenBAmount: z.string().min(1, "Token B amount is required"),
  tokenAAddress: z.string().min(1, "Token A address is required"),
  tokenBAddress: z.string().min(1, "Token B address is required"),
  slippage: z.string().optional().default("0.5"),
  userAddress: z.string().min(1, "User address is required"),
});

export type LiquidityFormState = {
  success?: boolean;
  error?: string;
  transaction?: string;
  fieldErrors?: {
    tokenAAmount?: string[];
    tokenBAmount?: string[];
    tokenAAddress?: string[];
    tokenBAddress?: string[];
    slippage?: string[];
    userAddress?: string[];
  };
};

const DEFAULT_BUY_TOKEN = "So11111111111111111111111111111111111111112";
const DEFAULT_SELL_TOKEN = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/**
 * Server Action for handling liquidity form submissions.
 *
 * This action validates the form data, calls the oRPC procedure,
 * and returns the transaction for client-side signing.
 *
 * Benefits:
 * - Works without JavaScript (progressive enhancement)
 * - Server-side validation
 * - Type-safe integration with oRPC
 * - No duplication of business logic
 */
export async function submitLiquidityAction(
  _prevState: LiquidityFormState,
  formData: FormData
): Promise<LiquidityFormState> {
  try {
    // Extract and validate form data
    const rawFormData = {
      tokenAAmount: formData.get("tokenAAmount") as string,
      tokenBAmount: formData.get("tokenBAmount") as string,
      tokenAAddress: formData.get("tokenAAddress") as string,
      tokenBAddress: formData.get("tokenBAddress") as string,
      slippage: formData.get("slippage") as string,
      userAddress: formData.get("userAddress") as string,
    };

    // Validate using Zod schema
    const validationResult = liquidityFormSchema.safeParse(rawFormData);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors,
      };
    }

    const {
      tokenAAmount,
      tokenBAmount,
      tokenAAddress,
      tokenBAddress,
      slippage,
      userAddress,
    } = validationResult.data;

    // Validate user address
    let publicKey: PublicKey;
    try {
      publicKey = new PublicKey(userAddress);
    } catch (_error) {
      return {
        success: false,
        error: "Invalid user address",
        fieldErrors: {
          userAddress: ["Invalid Solana address format"],
        },
      };
    }

    // Prepare token addresses with defaults
    const finalTokenAAddress = tokenAAddress?.trim() || DEFAULT_BUY_TOKEN;
    const finalTokenBAddress = tokenBAddress?.trim() || DEFAULT_SELL_TOKEN;

    // Sort tokens for consistent pool identification
    const sortedTokens = sortSolanaAddresses(
      finalTokenAAddress,
      finalTokenBAddress,
    );

    const { tokenXAddress, tokenYAddress } = sortedTokens;

    if (!tokenXAddress || !tokenYAddress) {
      return {
        success: false,
        error: "Invalid token addresses after sorting",
      };
    }

    // Parse amounts
    const sellAmount = parseAmount(tokenBAmount);
    const buyAmount = parseAmount(tokenAAmount);

    // Get pool details to determine token order
    const _poolDetails: unknown = null;
    try {
      // This would need to be implemented in the server client
      // For now, we'll assume we can determine the order from the addresses
      const isTokenXSell = tokenXAddress === finalTokenBAddress;
      const maxAmountX = isTokenXSell ? sellAmount : buyAmount;
      const maxAmountY = isTokenXSell ? buyAmount : sellAmount;

      // Prepare oRPC input
      const requestPayload: CreateLiquidityTransactionInput = {
        maxAmountX,
        maxAmountY,
        slippage: Number(slippage),
        tokenXMint: tokenXAddress,
        tokenYMint: tokenYAddress,
        user: publicKey.toBase58(),
      };

      // Call oRPC procedure directly on the server
      const response = await serverClient.liquidity.createLiquidityTransaction(
        requestPayload
      );

      if (!response.success || !response.transaction) {
        return {
          success: false,
          error: response.error || "Failed to create liquidity transaction",
        };
      }

      // Return success with transaction for client-side signing
      return {
        success: true,
        transaction: response.transaction,
      };
    } catch (error) {
      console.error("Server Action error:", error);

      const errorMessage = error instanceof Error
        ? error.message
        : "An unexpected error occurred";

      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (error) {
    console.error("Server Action validation error:", error);

    return {
      success: false,
      error: "Form processing failed",
    };
  }
}

/**
 * Alternative Server Action that handles the full flow including transaction submission.
 * This would be used if you want to handle signing on the server side (not recommended for wallets).
 */
export async function submitAndProcessLiquidityAction(
  prevState: LiquidityFormState,
  formData: FormData
): Promise<LiquidityFormState> {
  // First, create the transaction
  const transactionResult = await submitLiquidityAction(prevState, formData);

  if (!transactionResult.success || !transactionResult.transaction) {
    return transactionResult;
  }

  // Here you would handle the transaction submission and status checking
  // This is kept separate to maintain the separation of concerns

  return {
    ...transactionResult,
    // Additional processing results
  };
}

/**
 * Server Action for checking transaction status
 */
export async function checkLiquidityTransactionStatus(
  signature: string
): Promise<{ status: string; error?: string }> {
  try {
    const response = await serverClient.liquidity.checkLiquidityTransactionStatus({
      signature,
    });

    return {
      status: response.status,
      error: response.error,
    };
  } catch (error) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}