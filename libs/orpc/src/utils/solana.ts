import type { Idl } from "@coral-xyz/anchor";
import { BorshCoder } from "@coral-xyz/anchor";
import { type Connection, PublicKey } from "@solana/web3.js";
import IDL from "../darklake-idl";
import { getHelius } from "../getHelius";

export const EXCHANGE_PROGRAM_ID = new PublicKey(
  process.env.EXCHANGE_PROGRAM_ID ||
    "darkr3FB87qAZmgLwKov6Hk9Yiah5UT4rUYu8Zhthw1",
);

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
};

export async function sortSolanaAddresses(
  addrA: string,
  addrB: string,
): Promise<{ tokenXAddress: string; tokenYAddress: string }> {
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
    throw new Error("Failed to decode Pool account data");
  }
}

export async function getPoolPubkey(tokenA: string, tokenB: string) {
  const { tokenXAddress, tokenYAddress } = await sortSolanaAddresses(
    tokenA,
    tokenB,
  );

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
