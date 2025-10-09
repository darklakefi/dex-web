import { getAccount } from "@solana/spl-token";
import { type Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";

export interface PreTransactionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationContext {
  userAddress: string;
  tokenXMint: string;
  tokenYMint: string;
  lpTokenAmount: string;
  minTokenXOut: string;
  minTokenYOut: string;
  connection: Connection;
}

const MIN_SOL_BALANCE = 0.01;
const ESTIMATED_FEE_SOL = 0.005;

export async function validateWithdrawalTransaction(
  context: ValidationContext,
): Promise<PreTransactionValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const userPublicKey = new PublicKey(context.userAddress);

    const solBalance = await context.connection.getBalance(userPublicKey);
    const solBalanceSOL = solBalance / 1e9;

    if (solBalanceSOL < MIN_SOL_BALANCE) {
      errors.push(
        `Insufficient SOL balance. You have ${solBalanceSOL.toFixed(4)} SOL but need at least ${MIN_SOL_BALANCE} SOL for transaction fees.`,
      );
    } else if (solBalanceSOL < MIN_SOL_BALANCE + ESTIMATED_FEE_SOL) {
      warnings.push(
        `Low SOL balance. You have ${solBalanceSOL.toFixed(4)} SOL. Consider adding more SOL to avoid transaction failures.`,
      );
    }

    const tokenXAccount = await getAccount(
      context.connection,
      userPublicKey,
      "confirmed",
    ).catch(() => null);

    const tokenYAccount = await getAccount(
      context.connection,
      userPublicKey,
      "confirmed",
    ).catch(() => null);

    if (!tokenXAccount) {
      warnings.push(
        `Token account for ${context.tokenXMint} will be created automatically. This will require additional SOL for rent exemption.`,
      );
    }

    if (!tokenYAccount) {
      warnings.push(
        `Token account for ${context.tokenYMint} will be created automatically. This will require additional SOL for rent exemption.`,
      );
    }

    const minX = new BigNumber(context.minTokenXOut);
    const minY = new BigNumber(context.minTokenYOut);

    if (minX.lt(0) || minY.lt(0)) {
      errors.push("Minimum output amounts cannot be negative.");
    }

    return {
      errors,
      isValid: errors.length === 0,
      warnings,
    };
  } catch (error) {
    errors.push(
      `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return {
      errors,
      isValid: false,
      warnings,
    };
  }
}

export function formatValidationResult(
  result: PreTransactionValidationResult,
): string {
  if (result.isValid && result.warnings.length === 0) {
    return "Transaction validation passed.";
  }

  const messages: string[] = [];

  if (result.errors.length > 0) {
    messages.push("Errors:");
    messages.push(...result.errors.map((error) => `• ${error}`));
  }

  if (result.warnings.length > 0) {
    messages.push("Warnings:");
    messages.push(...result.warnings.map((warning) => `• ${warning}`));
  }

  return messages.join("\n");
}
