"use server";

import type { Idl } from "@coral-xyz/anchor";
import { BorshCoder } from "@coral-xyz/anchor";
import {
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { type Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import IDL from "../../darklake-idl";
import { getHelius } from "../../getHelius";
import type {
  GetAddLiquidityReviewInput,
  GetAddLiquidityReviewOutput,
} from "../../schemas/pools/getAddLiquidityReview.schema";
import { EXCHANGE_PROGRAM_ID } from "../../utils/solana";
import { getTokenDetailsHandler } from "../tokens/getTokenDetails.handler";

// Helper function to determine token program ID
async function getTokenProgramId(
  connection: Connection,
  accountPubkey: PublicKey,
): Promise<PublicKey> {
  try {
    const accountInfo = await connection.getAccountInfo(accountPubkey);
    if (!accountInfo) {
      throw new Error("Account not found");
    }

    // Check if the account owner is TOKEN_2022_PROGRAM_ID
    if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
      return TOKEN_2022_PROGRAM_ID;
    } else if (accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
      return TOKEN_PROGRAM_ID;
    } else {
      throw new Error("Invalid token program ID");
    }
  } catch (error) {
    console.error("Failed to determine token program ID:", error);
    // Default to legacy program
    return TOKEN_PROGRAM_ID;
  }
}

// Helper function to get token balance using SPL library
async function getTokenBalance(
  connection: Connection,
  accountPubkey: PublicKey,
  accountName: string,
): Promise<number> {
  try {
    // Determine the correct program ID for this token account
    const programId = await getTokenProgramId(connection, accountPubkey);

    // Use SPL token library to get account info with the correct program ID
    const account = await getAccount(
      connection,
      accountPubkey,
      undefined,
      programId,
    );
    const balance = Number(account.amount);
    console.log(`${accountName} Balance: ${balance}`);
    return balance;
  } catch (error) {
    console.error(
      `${accountName} failed to get balance: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 0;
  }
}

// Use Anchor's coder directly for decoding
const coder = new BorshCoder(IDL as Idl);

// Helper function to fetch and parse Pool account
async function getPoolAccount(
  connection: Connection,
  poolPubkey: PublicKey,
): Promise<any> {
  const accountInfo = await connection.getAccountInfo(poolPubkey);

  if (!accountInfo) {
    throw new Error("Pool not found");
  }

  // Decode the Pool account using Anchor's built-in decoder
  try {
    const pool = coder.accounts.decode("Pool", accountInfo.data);
    return pool;
  } catch (error) {
    console.error("Failed to decode Pool account:", error);
    throw new Error("Failed to decode Pool account data");
  }
}

export async function getAddLiquidityReviewHandler(
  input: GetAddLiquidityReviewInput,
): Promise<GetAddLiquidityReviewOutput> {
  try {
    const { tokenAmount, tokenXMint, tokenYMint, isTokenX } = input;

    const helius = getHelius();

    const amm_config_index = Buffer.alloc(4);
    amm_config_index.writeUInt8(0, 0);

    const [ammConfigPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from("amm_config"), amm_config_index],
      EXCHANGE_PROGRAM_ID,
    );

    const [poolPubkey] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        ammConfigPubkey.toBuffer(),
        new PublicKey(tokenXMint).toBuffer(),
        new PublicKey(tokenYMint).toBuffer(),
      ],
      EXCHANGE_PROGRAM_ID,
    );

    const connection = helius.connection;

    // Fetch and parse Pool account
    const pool = await getPoolAccount(connection, poolPubkey);

    // Get token balances from reserve accounts
    const reserveXBalance = await getTokenBalance(
      connection,
      pool.reserve_x,
      "Reserve X",
    );
    const reserveYBalance = await getTokenBalance(
      connection,
      pool.reserve_y,
      "Reserve Y",
    );

    // Calculate available reserves (excluding locked amounts and protocol fees)
    const liquidityReserveX =
      reserveXBalance - pool.user_locked_x - pool.protocol_fee_x;
    const liquidityReserveY =
      reserveYBalance - pool.user_locked_y - pool.protocol_fee_y;

    // Get token details for decimals
    const tokenX = await getTokenDetailsHandler({
      address: tokenXMint.toString(),
    });
    const tokenY = await getTokenDetailsHandler({
      address: tokenYMint.toString(),
    });

    if (isTokenX) {
      const scaledTokenXAmount = new BigNumber(tokenAmount).multipliedBy(
        10 ** tokenX.decimals,
      );

      // Calculate required Y amount based on the pool ratio
      // Formula: Y = X * (reserveY / reserveX)
      const tokenYAmountRaw = new BigNumber(scaledTokenXAmount)
        .multipliedBy(liquidityReserveY)
        .dividedBy(liquidityReserveX)
        .integerValue(BigNumber.ROUND_UP);

      // Convert raw amount back to user-friendly format
      const tokenYAmount = tokenYAmountRaw.dividedBy(10 ** tokenY.decimals);

      return {
        tokenAmount: tokenYAmount.toNumber(),
        tokenAmountRaw: tokenYAmountRaw.toString(),
      };
    } else {
      const scaledTokenYAmount = new BigNumber(tokenAmount).multipliedBy(
        10 ** tokenY.decimals,
      );

      // Calculate required X amount based on the pool ratio
      // Formula: X = Y * (reserveX / reserveY)
      const tokenXAmountRaw = new BigNumber(scaledTokenYAmount)
        .multipliedBy(liquidityReserveX)
        .dividedBy(liquidityReserveY)
        .integerValue(BigNumber.ROUND_UP);

      // Convert raw amount back to user-friendly format
      const tokenXAmount = tokenXAmountRaw.dividedBy(10 ** tokenX.decimals);

      return {
        tokenAmount: tokenXAmount.toNumber(),
        tokenAmountRaw: tokenXAmountRaw.toString(),
      };
    }
  } catch (error) {
    console.error("Failed to calculate token Y amount:", error);
    throw new Error("Failed to calculate token Y amount for liquidity");
  }
}
