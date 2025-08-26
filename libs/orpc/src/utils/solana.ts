import type { Idl } from "@coral-xyz/anchor";
import { BN, BorshCoder } from "@coral-xyz/anchor";
import {
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { type Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import IDL from "../darklake-idl";
import { getHelius } from "../getHelius";

export const EXCHANGE_PROGRAM_ID = new PublicKey(
  process.env.EXCHANGE_PROGRAM_ID ||
    "darkr3FB87qAZmgLwKov6Hk9Yiah5UT4rUYu8Zhthw1",
);

// 100% = 1000000, 0.0001% = 1
export const MAX_PERCENTAGE = 1000000;

export const LP_TOKEN_DECIMALS = 9;

export const IDL_CODER = new BorshCoder(IDL as Idl);

export type PoolAccount = {
  reserve_x: PublicKey;
  reserve_y: PublicKey;
  locked_x: number;
  locked_y: number;
  user_locked_x: number;
  user_locked_y: number;
  protocol_fee_x: number;
  protocol_fee_y: number;
  token_lp_supply: number;
};

export function sortSolanaAddresses(
  addrA: string,
  addrB: string,
): { tokenXAddress: string; tokenYAddress: string } {
  const aKey = new PublicKey(addrA);
  const bKey = new PublicKey(addrB);

  const comparison = aKey.toBuffer().compare(bKey.toBuffer());

  return comparison > 0
    ? { tokenXAddress: addrB, tokenYAddress: addrA }
    : { tokenXAddress: addrA, tokenYAddress: addrB };
}

export async function getPoolAccount(
  connection: Connection,
  poolPubkey: PublicKey,
): Promise<PoolAccount> {
  const accountInfo = await connection.getAccountInfo(poolPubkey);

  if (!accountInfo) {
    throw new Error("Pool not found");
  }

  try {
    const pool = IDL_CODER.accounts.decode<PoolAccount>(
      "Pool",
      accountInfo.data,
    );
    return pool;
  } catch (error) {
    console.error("Failed to decode Pool account:", error);
    throw new Error("Failed to decode pool account data");
  }
}

export async function getPoolPubkey(tokenA: string, tokenB: string) {
  const { tokenXAddress, tokenYAddress } = await sortSolanaAddresses(
    tokenA,
    tokenB,
  );

  const [ammConfigPubkey] = PublicKey.findProgramAddressSync(
    [Buffer.from("amm_config"), new BN(0).toArrayLike(Buffer, "le", 4)],
    EXCHANGE_PROGRAM_ID,
  );

  const [poolPubkey] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      ammConfigPubkey.toBuffer(),
      new PublicKey(tokenXAddress).toBuffer(),
      new PublicKey(tokenYAddress).toBuffer(),
    ],
    EXCHANGE_PROGRAM_ID,
  );

  return poolPubkey;
}

export async function getPoolOnChain(tokenXMint: string, tokenYMint: string) {
  const helius = getHelius();
  const connection = helius.connection;

  const poolPubkey = await getPoolPubkey(tokenXMint, tokenYMint);

  // Fetch and parse both Pool and AmmConfig accounts
  const pool = await getPoolAccount(connection, poolPubkey).catch((error) => {
    console.error("Failed to get pool account:", error);
    return null;
  });

  return pool;
}

// Helper function to determine token program ID
// THIS CAN ALSO BE FETCHED FROM TOKEN HANDLER (token program never changes)
export async function getTokenProgramId(
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

export const isSolanaAddress = (address: string) => {
  try {
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
      return false;
    }

    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

export const toRawUnits = (amount: number, decimals: number) => {
  return BigNumber(amount).multipliedBy(BigNumber(10 ** decimals));
};

export const toDecimals = (amount: number | BigNumber, decimals: number) => {
  return BigNumber(amount).dividedBy(BigNumber(10 ** decimals));
};

// Helper function to get token balance using SPL library
export async function getTokenBalance(
  connection: Connection,
  accountPubkey: PublicKey,
  accountName: string,
): Promise<BigNumber> {
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
    const balance = BigNumber(account.amount);
    return balance;
  } catch (error) {
    console.error(
      `${accountName} failed to get balance: ${error instanceof Error ? error.message : String(error)}`,
    );
    return BigNumber(0);
  }
}
