import type { Idl } from "@coral-xyz/anchor";
import { BN, BorshCoder } from "@coral-xyz/anchor";
import { sortSolanaAddresses } from "@dex-web/utils";
import {
  getAccount,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  type Connection,
  PublicKey,
  VersionedMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import BigNumber from "bignumber.js";
import IDL from "../darklake-idl";
import { getHeliusConnection } from "./getHeliusConnection";

export const EXCHANGE_PROGRAM_ID = new PublicKey(
  process.env.EXCHANGE_PROGRAM_ID ||
    "darkr3FB87qAZmgLwKov6Hk9Yiah5UT4rUYu8Zhthw1",
);

export const MAX_PERCENTAGE = 1000000;

export const LP_TOKEN_DECIMALS = 9;

/**
 * WSOL (Wrapped SOL) mint address
 */
export const WSOL_MINT = "So11111111111111111111111111111111111111111";

/**
 * SOL representation in UI (WSOL + 1)
 * Used to distinguish native SOL from WSOL in the UI
 */
export const SOL_MINT = "So11111111111111111111111111111111111111112";

/**
 * Normalizes SOL/WSOL addresses for pool and gateway operations.
 * SOL (WSOL+1) should be converted to WSOL for all pool operations
 * because pools only exist for WSOL, not for the SOL representation.
 *
 * @param mint - Token mint address (could be SOL or WSOL)
 * @returns WSOL address if input is SOL, otherwise returns the input unchanged
 */
export function normalizeTokenMintForPool(mint: string): string {
  return mint === SOL_MINT ? WSOL_MINT : mint;
}

export const IDL_CODER = new BorshCoder(IDL as Idl);

export type PoolAccount = {
  creator: PublicKey;
  amm_config: PublicKey;
  token_mint_x: PublicKey;
  token_mint_y: PublicKey;
  reserve_x: PublicKey;
  reserve_y: PublicKey;
  token_lp_supply: number;
  protocol_fee_x: number;
  protocol_fee_y: number;
  locked_x: number;
  locked_y: number;
  user_locked_x: number;
  user_locked_y: number;
  bump: number;
  padding: number[];
};

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
  const { tokenXAddress, tokenYAddress } = sortSolanaAddresses(tokenA, tokenB);

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
  const connection = getHeliusConnection();

  const poolPubkey = await getPoolPubkey(tokenXMint, tokenYMint);

  try {
    const pool = await getPoolAccount(connection, poolPubkey);
    return pool;
  } catch (_error) {
    return null;
  }
}

export async function getTokenProgramId(
  connection: Connection,
  accountPubkey: PublicKey,
): Promise<PublicKey> {
  try {
    const accountInfo = await connection.getAccountInfo(accountPubkey);
    if (!accountInfo) {
      throw new Error("Account not found");
    }

    if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
      return TOKEN_2022_PROGRAM_ID;
    } else if (accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
      return TOKEN_PROGRAM_ID;
    } else {
      throw new Error("Invalid token program ID");
    }
  } catch (error) {
    console.error("Failed to determine token program ID:", error);
    return TOKEN_PROGRAM_ID;
  }
}

export const deserializeVersionedTransaction = (base64Transaction: string) => {
  const unsignedTransactionBuffer = Buffer.from(base64Transaction, "base64");

  try {
    return VersionedTransaction.deserialize(unsignedTransactionBuffer);
  } catch {
    const version = unsignedTransactionBuffer[0];
    if (version !== 0) {
      throw new Error("Unsupported transaction version");
    }

    const messageBuffer = unsignedTransactionBuffer.slice(1);
    const message = VersionedMessage.deserialize(messageBuffer);
    const numRequiredSignatures = message.header.numRequiredSignatures;
    const signatures = Array(numRequiredSignatures).fill(new Uint8Array(64));

    return new VersionedTransaction(message, signatures);
  }
};

export async function getTokenBalance(
  connection: Connection,
  accountPubkey: PublicKey,
  accountName: string,
): Promise<BigNumber> {
  try {
    const programId = await getTokenProgramId(connection, accountPubkey);

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
      `${accountName} failed to get balance: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return BigNumber(0);
  }
}
