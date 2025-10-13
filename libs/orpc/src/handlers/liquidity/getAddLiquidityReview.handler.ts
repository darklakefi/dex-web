"use server";

import type { Idl } from "@coral-xyz/anchor";
import { BorshCoder } from "@coral-xyz/anchor";
import { getPoolTokenAddress } from "@dex-web/utils";
import { getAccount } from "@solana/spl-token";
import { type Connection, PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import IDL from "../../darklake-idl";
import { getHelius } from "../../getHelius";
import type {
  GetAddLiquidityReviewInput,
  GetAddLiquidityReviewOutput,
} from "../../schemas/liquidity/getAddLiquidityReview.schema";
import type { Token } from "../../schemas/tokens/token.schema";
import {
  EXCHANGE_PROGRAM_ID,
  getTokenProgramId,
  type PoolAccount,
} from "../../utils/solana";
import { getTokenMetadataHandler } from "../tokens/getTokenMetadata.handler";

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
    const tokenXMint = getPoolTokenAddress(input.tokenXMint);
    const tokenYMint = getPoolTokenAddress(input.tokenYMint);
    const { tokenAmount, isTokenX } = input;

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

    const liquidityReserveX = new BigNumber(reserveXBalance)
      .minus(new BigNumber(pool.user_locked_x.toString()))
      .minus(new BigNumber(pool.locked_x.toString()))
      .minus(new BigNumber(pool.protocol_fee_x.toString()))
      .toNumber();

    const liquidityReserveY = new BigNumber(reserveYBalance)
      .minus(new BigNumber(pool.user_locked_y.toString()))
      .minus(new BigNumber(pool.locked_y.toString()))
      .minus(new BigNumber(pool.protocol_fee_y.toString()))
      .toNumber();

    if (liquidityReserveX <= 0 || liquidityReserveY <= 0) {
      throw new Error("Insufficient liquidity reserves");
    }

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
