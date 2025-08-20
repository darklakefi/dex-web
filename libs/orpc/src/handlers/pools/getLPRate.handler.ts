"use server";

import type { Idl } from "@coral-xyz/anchor";
import { BorshCoder } from "@coral-xyz/anchor";
import {
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { type Connection, PublicKey } from "@solana/web3.js";
import IDL from "../../darklake-idl";
import { getHelius } from "../../getHelius";
import type {
  GetLPRateInput,
  GetLPRateOutput,
} from "../../schemas/pools/getLPRate.schema";
import type { Token } from "../../schemas/tokens/token.schema";
import { EXCHANGE_PROGRAM_ID, LP_TOKEN_DECIMALS } from "../../utils/solana";
import { getTokenMetadataHandler } from "../tokens/getTokenMetadata.handler";

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

// LP token estimation function
function estimateLPTokens(
  tokenXAmount: number,
  tokenYAmount: number,
  poolXReserves: number,
  poolYReserves: number,
  poolLPSupply: number,
): number {
  // Use X token calculation
  const lpFromX = (tokenXAmount * poolLPSupply) / poolXReserves;

  // Use Y token calculation
  const lpFromY = (tokenYAmount * poolLPSupply) / poolYReserves;

  // Both should be equal if ratios match
  // Return the smaller one to be conservative
  return Math.min(lpFromX, lpFromY);
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

export async function getLPRateHandler(
  input: GetLPRateInput,
): Promise<GetLPRateOutput> {
  try {
    const { tokenXAmount, tokenYAmount, tokenXMint, tokenYMint } = input;

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

    // Get LP token supply from pool account
    const poolLPSupply = Number(pool.token_lp_supply);

    // Scale input amounts based on token decimals
    const tokenMetadata = (await getTokenMetadataHandler({
      addresses: [tokenXMint, tokenYMint],
      returnAsObject: true,
    })) as Record<string, Token>;

    const tokenX = tokenMetadata[tokenXMint];
    const tokenY = tokenMetadata[tokenYMint];

    const scaledTokenXAmount = tokenXAmount * 10 ** (tokenX?.decimals ?? 0);
    const scaledTokenYAmount = tokenYAmount * 10 ** (tokenY?.decimals ?? 0);

    // Estimate LP tokens using the formula
    const estimatedLP = estimateLPTokens(
      scaledTokenXAmount,
      scaledTokenYAmount,
      liquidityReserveX,
      liquidityReserveY,
      poolLPSupply,
    );

    // Truncate estimatedLP to 9 decimal precision to avoid max float values
    const truncatedEstimatedLP = Math.floor(estimatedLP);

    // Convert LP tokens back to user-friendly format (assuming 9 decimals for LP tokens)
    const userFriendlyLP = truncatedEstimatedLP / 10 ** LP_TOKEN_DECIMALS;

    // APPLY SLIPPAGE
    let finalEstimatedLP = truncatedEstimatedLP;
    let finalUserFriendlyLP = userFriendlyLP;

    if (input.slippage && input.slippage > 0) {
      // Calculate slippage as a decimal (e.g., 5.5% becomes 0.055)
      const slippageDecimal = input.slippage / 100;

      // Apply slippage to raw units and round down
      const slippageAmount = Math.floor(truncatedEstimatedLP * slippageDecimal);
      finalEstimatedLP = truncatedEstimatedLP - slippageAmount;

      // Convert back to user-friendly format
      finalUserFriendlyLP = finalEstimatedLP / 10 ** LP_TOKEN_DECIMALS;
    }

    return {
      estimatedLPTokens: finalUserFriendlyLP,
      estimatedLPTokensRaw: finalEstimatedLP,
    };
  } catch (error) {
    console.error("Failed to get LP rate:", error);
    throw new Error("Failed to get LP rate");
  }
}
