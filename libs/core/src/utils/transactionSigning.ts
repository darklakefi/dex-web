import type { Transaction, VersionedTransaction } from "@solana/web3.js";
import { analyzeTransactionError } from "./transactionErrorHandling";

export type SignTransactionFunction<
  T extends Transaction | VersionedTransaction,
> = (transaction: T) => Promise<T>;

export async function signTransactionWithRecovery<
  T extends Transaction | VersionedTransaction,
>(transaction: T, signTransaction: SignTransactionFunction<T>): Promise<T> {
  try {
    return await signTransaction(transaction);
  } catch (signError) {
    const errorAnalysis = analyzeTransactionError(signError);

    if (errorAnalysis.canRecover) {
      console.warn(
        "Wallet simulation error detected, attempting recovery:",
        errorAnalysis.originalError.message,
      );

      if (
        signError &&
        typeof signError === "object" &&
        "transaction" in signError
      ) {
        const recoveredTransaction = signError.transaction;
        if (recoveredTransaction && typeof recoveredTransaction === "object") {
          return recoveredTransaction as T;
        }
      }
    }

    throw signError;
  }
}
