"use server";

import { checkLiquidityTransactionStatusHandler } from "@dex-web/orpc/handlers/liquidity/checkLiquidityTransactionStatus.handler";
import { createLiquidityTransactionHandler } from "@dex-web/orpc/handlers/liquidity/createLiquidityTransaction.handler";
import type { CreateLiquidityTransactionInput } from "@dex-web/orpc/schemas";
import { parseAmount, sortSolanaAddresses } from "@dex-web/utils";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";

const liquidityFormSchema = z.object({
  slippage: z.string().optional().default("0.5"),
  tokenAAddress: z.string().min(1, "Token A address is required"),
  tokenAAmount: z.string().min(1, "Token A amount is required"),
  tokenBAddress: z.string().min(1, "Token B address is required"),
  tokenBAmount: z.string().min(1, "Token B amount is required"),
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

export async function submitLiquidityAction(
  _prevState: LiquidityFormState,
  formData: FormData,
): Promise<LiquidityFormState> {
  try {
    const rawFormData = {
      slippage: formData.get("slippage") as string,
      tokenAAddress: formData.get("tokenAAddress") as string,
      tokenAAmount: formData.get("tokenAAmount") as string,
      tokenBAddress: formData.get("tokenBAddress") as string,
      tokenBAmount: formData.get("tokenBAmount") as string,
      userAddress: formData.get("userAddress") as string,
    };

    const validationResult = liquidityFormSchema.safeParse(rawFormData);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        error: "Validation failed",
        fieldErrors,
        success: false,
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

    let publicKey: PublicKey;
    try {
      publicKey = new PublicKey(userAddress);
    } catch (_error) {
      return {
        error: "Invalid user address",
        fieldErrors: {
          userAddress: ["Invalid Solana address format"],
        },
        success: false,
      };
    }

    const finalTokenAAddress = tokenAAddress?.trim() || DEFAULT_BUY_TOKEN;
    const finalTokenBAddress = tokenBAddress?.trim() || DEFAULT_SELL_TOKEN;

    const sortedTokens = sortSolanaAddresses(
      finalTokenAAddress,
      finalTokenBAddress,
    );

    const { tokenXAddress, tokenYAddress } = sortedTokens;

    if (!tokenXAddress || !tokenYAddress) {
      return {
        error: "Invalid token addresses after sorting",
        success: false,
      };
    }

    const sellAmount = parseAmount(tokenBAmount);
    const buyAmount = parseAmount(tokenAAmount);

    try {
      const isTokenXSell = tokenXAddress === finalTokenBAddress;
      const maxAmountX = isTokenXSell ? sellAmount : buyAmount;
      const maxAmountY = isTokenXSell ? buyAmount : sellAmount;

      const requestPayload: CreateLiquidityTransactionInput = {
        maxAmountX,
        maxAmountY,
        slippage: Number(slippage),
        tokenXMint: tokenXAddress,
        tokenYMint: tokenYAddress,
        user: publicKey.toBase58(),
      };

      const response = await createLiquidityTransactionHandler(requestPayload);

      if (!response.success || !response.transaction) {
        return {
          error: response.error || "Failed to create liquidity transaction",
          success: false,
        };
      }

      return {
        success: true,
        transaction: response.transaction,
      };
    } catch (error) {
      console.error("Server Action error:", error);

      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      return {
        error: errorMessage,
        success: false,
      };
    }
  } catch (error) {
    console.error("Server Action validation error:", error);

    return {
      error: "Form processing failed",
      success: false,
    };
  }
}

export async function submitAndProcessLiquidityAction(
  prevState: LiquidityFormState,
  formData: FormData,
): Promise<LiquidityFormState> {
  const transactionResult = await submitLiquidityAction(prevState, formData);

  if (!transactionResult.success || !transactionResult.transaction) {
    return transactionResult;
  }

  return {
    ...transactionResult,
  };
}

export async function checkLiquidityTransactionStatus(
  signature: string,
): Promise<{ status: string; error?: string }> {
  try {
    const response = await checkLiquidityTransactionStatusHandler({
      signature,
    });

    return {
      error: response.error,
      status: response.status,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      status: "error",
    };
  }
}
