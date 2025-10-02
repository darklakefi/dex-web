"use server";

import { AnchorProvider } from "@coral-xyz/anchor";
import { validateWithdrawalTransaction } from "@dex-web/core";
import { sortSolanaAddresses } from "@dex-web/utils";
import {
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import { getHelius } from "../../getHelius";
import type {
  WithdrawLiquidityInput,
  WithdrawLiquidityOutput,
} from "../../schemas/liquidity/withdrawLiquidity.schema";
import {
  handleNetworkError,
  handleTransactionError,
  handleValidationError,
} from "../../utils/orpcErrorHandling";
import { LP_TOKEN_DECIMALS } from "../../utils/solana";
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

    const validationResult = await validateWithdrawalTransaction({
      connection,
      lpTokenAmount,
      minTokenXOut,
      minTokenYOut,
      tokenXMint,
      tokenYMint,
      userAddress: ownerAddress,
    });

    if (!validationResult.isValid) {
      return {
        error: validationResult.errors.join("; "),
        success: false,
        unsignedTransaction: null,
      };
    }

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

    const lpAmountBase = new Decimal(lpTokenAmount || "0")
      .mul(new Decimal(10).pow(LP_TOKEN_DECIMALS))
      .floor();
    const minXBase = new Decimal(minTokenXOut || "0")
      .mul(new Decimal(10).pow(xMintInfo.decimals))
      .floor();
    const minYBase = new Decimal(minTokenYOut || "0")
      .mul(new Decimal(10).pow(yMintInfo.decimals))
      .floor();

    if (lpAmountBase.isNegative()) {
      handleValidationError("amount", "LP amount must be non-negative");
    }
    if (minXBase.isNegative()) {
      handleValidationError(
        "minTokenXOut",
        "Minimum token out must be non-negative",
      );
    }
    if (minYBase.isNegative()) {
      handleValidationError(
        "minTokenYOut",
        "Minimum token out must be non-negative",
      );
    }

    const txResult = await removeLiquidityTransactionHandler({
      lpTokensToBurn: lpAmountBase.toFixed(0),
      minAmountX: minXBase.toFixed(0),
      minAmountY: minYBase.toFixed(0),
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
    if (error instanceof Error) {
      if (error.message.includes("exceeds max safe integer")) {
        handleValidationError("amount", error.message);
      }

      if (error.message.includes("Account resolution failed")) {
        handleNetworkError("Account resolution failed", true);
      }
    }

    handleTransactionError(error, "withdrawLiquidity");
  }
}
