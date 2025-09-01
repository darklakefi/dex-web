import type { Wallet } from "@solana/wallet-adapter-react";
import {
  ComputeBudgetProgram,
  type TransactionInstruction,
} from "@solana/web3.js";
import { isSquadsX } from "./isSquadsX";

interface ComputeBudgetOptions {
  units?: number;
  microLamports?: number;
}

/**
 * Gets appropriate compute budget instructions based on wallet type
 * SquadsX: Uses compute budget instructions (recommended over Jito)
 * Other wallets: Can use Jito bundles or compute budget instructions
 */
export function getComputeBudgetInstructions(
  wallet: Wallet | null | undefined,
  options: ComputeBudgetOptions = {},
): TransactionInstruction[] {
  const { units = 400_000, microLamports = 50_000 } = options;

  if (isSquadsX(wallet)) {
    // For SquadsX, always use compute budget instructions
    // Jito bundles are not recommended as tip instructions get wrapped
    return [
      ComputeBudgetProgram.setComputeUnitLimit({ units }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
    ];
  }

  // For other wallets, you can choose to use Jito bundles or compute budget
  // This implementation defaults to compute budget, but you could add Jito logic here
  return [
    ComputeBudgetProgram.setComputeUnitLimit({ units }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
  ];
}

/**
 * Determines if Jito bundles should be used for the given wallet
 */
export function shouldUseJito(wallet: Wallet | null | undefined): boolean {
  // Never use Jito with SquadsX
  if (isSquadsX(wallet)) {
    return false;
  }

  // You can add additional logic here to determine when to use Jito
  // For example, based on environment variables or user preferences
  return Boolean(
    process.env.ENABLE_JITO && process.env.ENABLE_JITO !== "false",
  );
}
