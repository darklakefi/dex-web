import type { Wallet } from "@solana/wallet-adapter-react";
import {
  ComputeBudgetProgram,
  type TransactionInstruction,
} from "@solana/web3.js";

interface ComputeBudgetOptions {
  units?: number;
  microLamports?: number;
}

function isSquadsX(wallet: Wallet | null | undefined): boolean {
  return wallet?.adapter?.name === "SquadsX";
}

export function getComputeBudgetInstructions(
  wallet: Wallet | null | undefined,
  options: ComputeBudgetOptions = {},
): TransactionInstruction[] {
  const { units = 400_000, microLamports = 50_000 } = options;

  if (isSquadsX(wallet)) {
    return [
      ComputeBudgetProgram.setComputeUnitLimit({ units }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
    ];
  }

  return [
    ComputeBudgetProgram.setComputeUnitLimit({ units }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
  ];
}

export function shouldUseJito(wallet: Wallet | null | undefined): boolean {
  if (isSquadsX(wallet)) {
    return false;
  }

  return Boolean(
    process.env.ENABLE_JITO && process.env.ENABLE_JITO !== "false",
  );
}
