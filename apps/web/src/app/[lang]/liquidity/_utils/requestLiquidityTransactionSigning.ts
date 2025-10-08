import type {
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { requestTransactionSigning } from "../../../_utils/requestTransactionSigning";

interface RequestLiquidityTransactionSigningProps {
  publicKey: PublicKey;
  signTransaction:
    | (<T extends Transaction | VersionedTransaction>(
        transaction: T,
      ) => Promise<T>)
    | undefined;
  setLiquidityStep: (step: number) => void;
  unsignedTransaction: string;
  tokenXMint: string;
  tokenYMint: string;
  onSuccess: () => void;
  trackingId: string;
}

/**
 * Liquidity-specific wrapper for transaction signing.
 * Uses the generic requestTransactionSigning utility with liquidity-specific configuration.
 */
export async function requestLiquidityTransactionSigning({
  publicKey,
  signTransaction,
  setLiquidityStep,
  unsignedTransaction,
  tokenXMint,
  tokenYMint,
  onSuccess,
  trackingId,
}: RequestLiquidityTransactionSigningProps): Promise<void> {
  return requestTransactionSigning({
    onSuccess,
    publicKey,
    setStep: setLiquidityStep,
    signTransaction,
    tokenXMint,
    tokenYMint,
    trackingId,
    transactionType: "addLiquidity",
    unsignedTransaction,
    userAddress: publicKey.toBase58(),
  });
}
