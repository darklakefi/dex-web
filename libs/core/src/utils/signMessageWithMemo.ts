import type { Wallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
);

function isSquadsX(wallet: Wallet | null | undefined): boolean {
  return wallet?.adapter?.name === "SquadsX";
}

export async function createMemoTransaction(
  connection: Connection,
  wallet: PublicKey,
  message: string,
): Promise<Transaction> {
  const memoInstruction = new TransactionInstruction({
    data: Buffer.from(message, "utf8"),
    keys: [],
    programId: MEMO_PROGRAM_ID,
  });

  const transaction = new Transaction();
  transaction.add(memoInstruction);

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet;

  return transaction;
}

export async function signMessageCompat(
  wallet: Wallet,
  message: string,
  connection: Connection = new Connection(clusterApiUrl("devnet")),
): Promise<{ signature: string; transaction?: Transaction }> {
  const walletAdapter = wallet.adapter;
  if (!walletAdapter.publicKey) {
    throw new Error("Wallet not connected");
  }

  if (isSquadsX(wallet)) {
    if (!wallet.adapter || !("signTransaction" in wallet.adapter)) {
      throw new Error("Wallet does not support transaction signing");
    }

    const transaction = await createMemoTransaction(
      connection,
      wallet.adapter.publicKey!,
      message,
    );

    const signedTransaction = await wallet.adapter.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
    );

    return {
      signature,
      transaction: signedTransaction,
    };
  }

  if ("signMessage" in wallet.adapter && wallet.adapter.signMessage) {
    try {
      const encodedMessage = new TextEncoder().encode(message);
      const signatureUint8Array =
        await wallet.adapter.signMessage(encodedMessage);
      const signature = Array.from(signatureUint8Array)
        .map((b) => (b as number).toString(16).padStart(2, "0"))
        .join("");

      return { signature };
    } catch (error) {
      console.warn(
        "Direct message signing failed, falling back to memo transaction:",
        error,
      );
    }
  }

  if (
    "signTransaction" in wallet.adapter &&
    wallet.adapter.signTransaction &&
    wallet.adapter.publicKey
  ) {
    const transaction = await createMemoTransaction(
      connection,
      wallet.adapter.publicKey!,
      message,
    );

    const signedTransaction = await wallet.adapter.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(
      signedTransaction.serialize(),
    );

    return {
      signature,
      transaction: signedTransaction,
    };
  }

  throw new Error(
    "Wallet does not support message signing or transaction signing",
  );
}

export interface VerifyMemoSignatureParams {
  signature: string;
  message: string;
  walletAddress: string;
  connection: Connection;
}

export async function verifyMemoSignature({
  signature,
  message,
  walletAddress,
  connection,
}: VerifyMemoSignatureParams): Promise<{
  isValid: boolean;
  isSquadsX?: boolean;
}> {
  try {
    const tx = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!tx?.transaction) {
      return { isValid: false };
    }

    const signer = tx.transaction.message.staticAccountKeys[0];
    if (signer!.toBase58() !== walletAddress) {
      return { isValid: false };
    }

    const accountKeys = tx.transaction.message.getAccountKeys();
    const isSquadsX = accountKeys.staticAccountKeys.some(
      (key) =>
        key.toBase58().includes("vault") || key.toBase58().includes("squad"),
    );

    const instructions =
      "instructions" in tx.transaction.message
        ? tx.transaction.message.instructions
        : tx.transaction.message.compiledInstructions;

    const memoInstruction = instructions.find(
      (ix: { programIdIndex: number; data: string | Uint8Array }) => {
        const programId = accountKeys.get(ix.programIdIndex);
        return programId?.equals(MEMO_PROGRAM_ID);
      },
    );

    if (!memoInstruction) {
      return { isSquadsX, isValid: false };
    }

    const memoData = Buffer.from(memoInstruction.data).toString("utf8");
    const isValid = memoData === message;

    return { isSquadsX, isValid };
  } catch (error) {
    console.error("Error verifying memo signature:", error);
    return { isValid: false };
  }
}
