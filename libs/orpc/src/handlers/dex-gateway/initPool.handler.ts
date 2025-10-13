"use server";
import type { InitPoolRequest, InitPoolResponse } from "@dex-web/grpc-client";
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
export async function initPoolHandler(
  input: InitPoolRequest,
): Promise<InitPoolResponse> {
  try {
    const grpcClient = await getDexGatewayClient();
    const response = await grpcClient.initPool(input);

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
              lamports: input.amountX,
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
              lamports: input.amountY,
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

    return response;
  } catch (error) {
    console.error("gRPC call failed:", error);
    throw error;
  }
}
