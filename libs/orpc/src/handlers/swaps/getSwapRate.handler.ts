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
import * as fs from "fs";
import * as path from "path";
import { getHelius } from "../../getHelius";
import type {
  GetSwapRateInput,
  GetSwapRateOutput,
} from "../../schemas/swaps/getSwapRate.schema";
import { getTokenDetailsHandler } from "../tokens/getTokenDetails.handler";

// TODO: put this somewhere configurable based on env
const EXCHANGE_PROGRAM_ID = new PublicKey(
  "3LS7r7w6bx6UrTkgHiHGsKZYDLqbE7XWWt24wmYk2sAq",
);

// 100% = 1000000, 0.0001% = 1
const MAX_PERCENTAGE = 1000000;

// Helper function to determine token program ID
// THIS CAN ALSO BE FETCHED FROM TOKEN HANDLER (token program never changes)
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

// Helper function to calculate trade fee
function getTradeFee(sourceAmount: number, tradeFeeRate: number): number {
  // tradeFeeRate is in basis points (e.g., 1000000 = 100%, 1 = 0.0001%)
  // rounding up in our favor
  return Math.ceil((sourceAmount * tradeFeeRate) / MAX_PERCENTAGE);
}

// Constant product formula (like Uniswap AMM)
function swapBaseInputWithoutFees(
  sourceAmount: number,
  swapSourceAmount: number,
  swapDestinationAmount: number,
): number {
  // (x + delta_x) * (y - delta_y) = x * y
  // delta_y = (delta_x * y) / (x + delta_x)
  const numerator = sourceAmount * swapDestinationAmount;
  const denominator = swapSourceAmount + sourceAmount;
  const destinationAmountSwapped = Math.floor(numerator / denominator);
  return destinationAmountSwapped;
}

// Main swap calculation function
function calculateSwap(
  sourceAmount: number,
  poolSourceAmount: number,
  poolDestinationAmount: number,
  tradeFeeRate: number,
): {
  destinationAmount: number;
  tradeFee: number;
  sourceAmountPostFees: number;
  rate: number;
} {
  // Calculate fee from input
  const tradeFee = getTradeFee(sourceAmount, tradeFeeRate);

  // Subtract fee from input
  const sourceAmountPostFees = sourceAmount - tradeFee;

  // Use post fee amount to calculate output
  const destinationAmountSwapped = swapBaseInputWithoutFees(
    sourceAmountPostFees,
    poolSourceAmount,
    poolDestinationAmount,
  );

  // Calculate rate (output per input)
  const rate = destinationAmountSwapped / sourceAmount;

  return {
    destinationAmount: destinationAmountSwapped,
    rate,
    sourceAmountPostFees,
    tradeFee,
  };
}

// Load the IDL
const idlPath = path.join(__dirname, "../../../darklake-idl.json");
const idl = JSON.parse(fs.readFileSync(idlPath, "utf8")) as Idl;

// Use Anchor's coder directly for decoding
const coder = new BorshCoder(idl);

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
    console.log("Pool data:", pool);
    return pool;
  } catch (error) {
    console.error("Failed to decode Pool account:", error);
    throw new Error("Failed to decode Pool account data");
  }
}

// The response should be CACHED (or outright provided as env param since fees will change almost never)
async function getAmmConfigAccount(
  connection: Connection,
  ammConfigPubkey: PublicKey,
): Promise<any> {
  const accountInfo = await connection.getAccountInfo(ammConfigPubkey);

  if (!accountInfo) {
    throw new Error("AmmConfig not found");
  }

  // Decode the AmmConfig account using Anchor's built-in decoder
  try {
    const ammConfig = coder.accounts.decode("AmmConfig", accountInfo.data);
    return ammConfig;
  } catch (error) {
    console.error("Failed to decode AmmConfig account:", error);
    throw new Error("Failed to decode AmmConfig account data");
  }
}

export async function getSwapRateHandler(
  input: GetSwapRateInput,
): Promise<GetSwapRateOutput> {
  const { amountIn, isXtoY, tokenXMint, tokenYMint } = input;

  const tokenXMintPubkey = new PublicKey(tokenXMint);
  const tokenYMintPubkey = new PublicKey(tokenYMint);

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

  // Fetch and parse both Pool and AmmConfig accounts
  const pool = await getPoolAccount(connection, poolPubkey);
  const ammConfig = await getAmmConfigAccount(connection, ammConfigPubkey);

  // Get token balances from reserve accounts
  let reserveXBalance = 0;
  let reserveYBalance = 0;

  // Get token balances
  reserveXBalance = await getTokenBalance(
    connection,
    pool.reserve_x,
    "Reserve X",
  );
  reserveYBalance = await getTokenBalance(
    connection,
    pool.reserve_y,
    "Reserve Y",
  );

  const availableReserveX =
    reserveXBalance - pool.locked_x - pool.user_locked_x - pool.protocol_fee_x;
  const availableReserveY =
    reserveYBalance - pool.locked_y - pool.user_locked_y - pool.protocol_fee_y;

  // Calculate swap using AMM formula
  const tradeFeeRate = Number(ammConfig.trade_fee_rate) || 0;
  const swapResult = calculateSwap(
    amountIn,
    isXtoY ? availableReserveX : availableReserveY,
    isXtoY ? availableReserveY : availableReserveX,
    tradeFeeRate,
  );

  const tokenX = await getTokenDetailsHandler({
    address: tokenXMint.toString(),
  });
  const tokenY = await getTokenDetailsHandler({
    address: tokenYMint.toString(),
  });

  const amountInBigDecimal = BigNumber(amountIn).multipliedBy(
    BigNumber(10 ** (isXtoY ? tokenX.decimals : tokenY.decimals)),
  );
  const amountOutBigDecimal = BigNumber(swapResult.destinationAmount);

  const amountOut = amountOutBigDecimal
    .dividedBy(BigNumber(10 ** (isXtoY ? tokenY.decimals : tokenX.decimals)))
    .toNumber();

  return {
    amountIn,
    amountInRaw: amountInBigDecimal.toNumber(),
    amountOut,
    amountOutRaw: amountOutBigDecimal.toNumber(),
    estimatedFee: swapResult.tradeFee,
    rateXtoY: swapResult.rate,
  };
}
