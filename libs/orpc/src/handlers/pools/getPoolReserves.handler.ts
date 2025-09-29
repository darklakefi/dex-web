"use server";

import {
  type Account,
  getAccount,
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { type Connection, PublicKey } from "@solana/web3.js";
import { getHelius } from "../../getHelius";
import type {
  GetPoolReservesInput,
  GetPoolReservesOutput,
} from "../../schemas/pools/getPoolReserves.schema";
import { getLpTokenMint } from "@dex-web/core";
import { getPoolOnChain, LP_TOKEN_DECIMALS } from "../../utils/solana";

async function detectTokenProgram(
  connection: Connection,
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

export async function getPoolReservesHandler({
  tokenXMint,
  tokenYMint,
}: GetPoolReservesInput): Promise<GetPoolReservesOutput> {
  const helius = getHelius();
  const connection = helius.connection;

  try {
    const poolData = await getPoolOnChain(tokenXMint, tokenYMint);

    if (!poolData) {
      return {
        exists: false,
        lpMint: "",
        reserveX: 0,
        reserveY: 0,
        totalLpSupply: 0,
      };
    }

    const lpTokenMint = await getLpTokenMint(tokenXMint, tokenYMint);
    const lpTokenMintString = lpTokenMint.toBase58();

    const lpMintInfo = await getMint(
      connection,
      lpTokenMint,
      "confirmed",
      TOKEN_PROGRAM_ID,
    );
    const totalLpSupply = Number(lpMintInfo.supply) / 10 ** LP_TOKEN_DECIMALS;

    const reserveXAccountInfo = await connection.getAccountInfo(
      poolData.reserve_x,
    );
    const reserveYAccountInfo = await connection.getAccountInfo(
      poolData.reserve_y,
    );

    if (!reserveXAccountInfo || !reserveYAccountInfo) {
      return {
        exists: false,
        lpMint: lpTokenMintString,
        reserveX: 0,
        reserveY: 0,
        totalLpSupply: 0,
      };
    }

    const reserveXProgramId = reserveXAccountInfo.owner;
    const reserveYProgramId = reserveYAccountInfo.owner;

    const tokenXProgramId = await detectTokenProgram(
      connection,
      new PublicKey(tokenXMint),
    );
    const tokenYProgramId = await detectTokenProgram(
      connection,
      new PublicKey(tokenYMint),
    );

    let reserveXAccount: Account | null = null;
    let reserveYAccount: Account | null = null;

    let reserveXBalance = 0;
    try {
      reserveXAccount = await getAccount(
        connection,
        poolData.reserve_x,
        "confirmed",
        reserveXProgramId,
      );
      reserveXBalance = Number(reserveXAccount.amount);
    } catch (error) {
      console.warn("Could not read reserve X as token account:", error);
      reserveXBalance = 0;
    }

    let reserveYBalance = 0;
    try {
      reserveYAccount = await getAccount(
        connection,
        poolData.reserve_y,
        "confirmed",
        reserveYProgramId,
      );
      reserveYBalance = Number(reserveYAccount.amount);
    } catch (error) {
      console.warn("Could not read reserve Y as token account:", error);
      reserveYBalance = 0;
    }

    const tokenXMintInfo = await getMint(
      connection,
      new PublicKey(tokenXMint),
      "confirmed",
      tokenXProgramId,
    );
    const tokenYMintInfo = await getMint(
      connection,
      new PublicKey(tokenYMint),
      "confirmed",
      tokenYProgramId,
    );

    const reserveX = reserveXBalance / 10 ** tokenXMintInfo.decimals;
    const reserveY = reserveYBalance / 10 ** tokenYMintInfo.decimals;

    const safeReserveX =
      Number.isNaN(reserveX) || !Number.isFinite(reserveX) ? 0 : reserveX;
    const safeReserveY =
      Number.isNaN(reserveY) || !Number.isFinite(reserveY) ? 0 : reserveY;
    const safeTotalLpSupply =
      Number.isNaN(totalLpSupply) || !Number.isFinite(totalLpSupply)
        ? 0
        : totalLpSupply;

    const result = {
      exists: true,
      lpMint: lpTokenMintString,
      reserveX: safeReserveX,
      reserveY: safeReserveY,
      totalLpSupply: safeTotalLpSupply,
    };

    console.log("Returning pool reserves result:", result);
    return result;
  } catch (error) {
    console.error("Error getting pool reserves:", error);
    return {
      exists: false,
      lpMint: "",
      reserveX: 0,
      reserveY: 0,
      totalLpSupply: 0,
    };
  }
}
