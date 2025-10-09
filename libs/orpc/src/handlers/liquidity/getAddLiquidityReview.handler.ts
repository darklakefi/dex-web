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
} from "../../schemas/liquidity/getAddLiquidityReview.schema";
import type { Token } from "../../schemas/tokens/token.schema";
import { EXCHANGE_PROGRAM_ID, type PoolAccount } from "../../utils/solana";
import { getTokenMetadataHandler } from "../tokens/getTokenMetadata.handler";

async function getTokenProgramId(
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

async function getTokenBalance(
  connection: Connection,
  accountPubkey: PublicKey,
  accountName: string,
): Promise<number> {
  try {
    const programId = await getTokenProgramId(connection, accountPubkey);

    const account = await getAccount(
      connection,
      accountPubkey,
      undefined,
      programId,
    );
    const balance = Number(account.amount);
    return balance;
  } catch (error) {
    console.error(
      `${accountName} failed to get balance: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 0;
  }
}

const coder = new BorshCoder(IDL as Idl);

async function getPoolAccount(
  connection: Connection,
  poolPubkey: PublicKey,
): Promise<PoolAccount> {
  const accountInfo = await connection.getAccountInfo(poolPubkey);

  if (!accountInfo) {
    throw new Error("Pool not found");
  }

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

    const pool = await getPoolAccount(connection, poolPubkey).catch((error) => {
      console.error("Failed to get pool account:", error);
      throw new Error("Pool not found");
    });

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

    /**
     * Converts various numeric formats from the on-chain pool account to a JavaScript number.
     * The pool account may contain BN (BigNumber from anchor), number, or string representations.
     */
    const toNum = (
      val: number | string | { toNumber?: () => number } | null | undefined,
    ): number => {
      if (!val) return 0;
      if (typeof val === "number") return val;
      if (
        typeof val === "object" &&
        "toNumber" in val &&
        typeof val.toNumber === "function"
      ) {
        return val.toNumber();
      }
      if (typeof val === "string") {
        const num = Number(val);
        if (!Number.isNaN(num)) return num;
        return parseInt(val, 16);
      }
      return 0;
    };

    const liquidityReserveX =
      reserveXBalance -
      toNum(pool.user_locked_x) -
      toNum(pool.locked_x) -
      toNum(pool.protocol_fee_x);
    const liquidityReserveY =
      reserveYBalance -
      toNum(pool.user_locked_y) -
      toNum(pool.locked_y) -
      toNum(pool.protocol_fee_y);

    const tokenMetadata = (await getTokenMetadataHandler({
      addresses: [tokenXMint, tokenYMint],
      returnAsObject: true,
    })) as Record<string, Token>;

    const tokenX = tokenMetadata[tokenXMint]!;
    const tokenY = tokenMetadata[tokenYMint]!;

    if (isTokenX) {
      const scaledTokenXAmount = new BigNumber(tokenAmount).multipliedBy(
        10 ** tokenX.decimals,
      );

      const tokenYAmountRaw = new BigNumber(scaledTokenXAmount)
        .multipliedBy(liquidityReserveY)
        .dividedBy(liquidityReserveX)
        .integerValue(BigNumber.ROUND_UP);

      const tokenYAmount = tokenYAmountRaw.dividedBy(10 ** tokenY.decimals);

      return {
        tokenAmount: tokenYAmount.toNumber(),
        tokenAmountRaw: tokenYAmountRaw.toString(),
      };
    } else {
      const scaledTokenYAmount = new BigNumber(tokenAmount).multipliedBy(
        10 ** tokenY.decimals,
      );

      const tokenXAmountRaw = new BigNumber(scaledTokenYAmount)
        .multipliedBy(liquidityReserveX)
        .dividedBy(liquidityReserveY)
        .integerValue(BigNumber.ROUND_UP);

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
