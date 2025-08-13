"use server";

import { AnchorProvider } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { getHelius } from "../../getHelius";
import type {
  WithdrawLiquidityInput,
  WithdrawLiquidityOutput,
} from "../../schemas/pools/withdrawLiquidity.schema";
import { sortSolanaAddresses } from "../../utils/solana";
import { removeLiquidityTxHandler } from "./removeLiquidityTx.handler";

export async function withdrawLiquidityHandler({
  tokenXMint,
  tokenYMint,
  lpTokenAmount,
  ownerAddress,
  minTokenXOut = "0",
  minTokenYOut = "0",
}: WithdrawLiquidityInput): Promise<WithdrawLiquidityOutput> {
  try {
    const helius = getHelius();
    const connection = helius.connection;

    const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(
      tokenXMint,
      tokenYMint,
    );

    const dummyKeypair = new PublicKey(ownerAddress);
    const provider = new AnchorProvider(
      connection,
      {
        publicKey: dummyKeypair,
        signAllTransactions: async (txs) => txs,
        signTransaction: async (tx) => tx,
      },
      { commitment: "confirmed" },
    );

    const lpTokenAmountBN = new BigNumber(lpTokenAmount);
    const minTokenXOutBN = new BigNumber(minTokenXOut);
    const minTokenYOutBN = new BigNumber(minTokenYOut);

    const txResult = await removeLiquidityTxHandler({
      lpTokensToBurn: lpTokenAmountBN.toNumber(),
      minAmountX: minTokenXOutBN.toNumber(),
      minAmountY: minTokenYOutBN.toNumber(),
      provider,
      tokenXMint: tokenXAddress,
      tokenXProgramId: TOKEN_PROGRAM_ID.toBase58(),
      tokenYMint: tokenYAddress,
      tokenYProgramId: TOKEN_PROGRAM_ID.toBase58(),
      user: ownerAddress,
    });

    if (!txResult.success || !txResult.transaction) {
      return {
        error: "Failed to build withdraw transaction",
        success: false,
        unsignedTransaction: null,
      };
    }

    // Serialize transaction to base64 for frontend signing
    const serializedTransaction = txResult.transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    const base64Transaction = serializedTransaction.toString("base64");

    return {
      success: true,
      unsignedTransaction: base64Transaction,
    };
  } catch (error) {
    console.error("Error withdrawing liquidity:", error);
    return {
      error: error instanceof Error ? error.message : "Unknown error occurred",
      success: false,
      unsignedTransaction: null,
    };
  }
}
