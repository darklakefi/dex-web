"use server";

import { AnchorProvider } from "@coral-xyz/anchor";
import {
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { getHelius } from "../../getHelius";
import type {
  WithdrawLiquidityInput,
  WithdrawLiquidityOutput,
} from "../../schemas/liquidity/withdrawLiquidity.schema";
import { LP_TOKEN_DECIMALS, sortSolanaAddresses } from "../../utils/solana";
import { removeLiquidityTransactionHandler } from "./removeLiquidityTransaction.handler";

async function detectTokenProgram(
  connection: Parameters<typeof getMint>[0],
  mint: PublicKey,
): Promise<PublicKey> {
  try {
    await getMint(connection, mint, "confirmed", TOKEN_PROGRAM_ID);
    return TOKEN_PROGRAM_ID;
  } catch {
    try {
      await getMint(connection, mint, "confirmed", TOKEN_2022_PROGRAM_ID);
      return TOKEN_2022_PROGRAM_ID;
    } catch {
      return TOKEN_PROGRAM_ID;
    }
  }
}

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

    const xMintPk = new PublicKey(tokenXAddress);
    const yMintPk = new PublicKey(tokenYAddress);

    const tokenXProgramId = await detectTokenProgram(connection, xMintPk);
    const tokenYProgramId = await detectTokenProgram(connection, yMintPk);

    const xMintInfo = await getMint(
      connection,
      xMintPk,
      "confirmed",
      tokenXProgramId,
    );
    const yMintInfo = await getMint(
      connection,
      yMintPk,
      "confirmed",
      tokenYProgramId,
    );

    const lpAmountBase = lpTokenAmountBN
      .multipliedBy(new BigNumber(10).pow(LP_TOKEN_DECIMALS))
      .integerValue(BigNumber.ROUND_FLOOR);
    const minXBase = minTokenXOutBN
      .multipliedBy(new BigNumber(10).pow(xMintInfo.decimals))
      .integerValue(BigNumber.ROUND_FLOOR);
    const minYBase = minTokenYOutBN
      .multipliedBy(new BigNumber(10).pow(yMintInfo.decimals))
      .integerValue(BigNumber.ROUND_FLOOR);

    // Guard against JS number precision limits
    const toSafeNumber = (bn: BigNumber, label: string) => {
      if (bn.gt(Number.MAX_SAFE_INTEGER)) {
        throw new Error(`${label} exceeds max safe integer`);
      }
      return bn.toNumber();
    };

    const txResult = await removeLiquidityTransactionHandler({
      lpTokensToBurn: toSafeNumber(lpAmountBase, "LP amount"),
      minAmountX: toSafeNumber(minXBase, "minTokenXOut"),
      minAmountY: toSafeNumber(minYBase, "minTokenYOut"),
      provider,
      tokenXMint: tokenXAddress,
      tokenXProgramId: tokenXProgramId.toBase58(),
      tokenYMint: tokenYAddress,
      tokenYProgramId: tokenYProgramId.toBase58(),
      user: ownerAddress,
    });

    if (!txResult.success || !txResult.transaction) {
      return {
        error: "Failed to build withdraw transaction",
        success: false,
        unsignedTransaction: null,
      };
    }

    try {
      txResult.transaction.feePayer = new PublicKey(ownerAddress);
      const { blockhash } = await connection.getLatestBlockhash("finalized");
      txResult.transaction.recentBlockhash = blockhash;
    } catch (e) {
      console.warn("Failed to stamp feePayer/recentBlockhash", e);
    }

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
