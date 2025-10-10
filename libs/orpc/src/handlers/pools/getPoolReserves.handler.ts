"use server";
import { getLpTokenMint } from "@dex-web/core";
import {
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

function toNumber(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") return value;

  if (
    typeof value === "object" &&
    "toNumber" in value &&
    typeof value.toNumber === "function"
  ) {
    return value.toNumber();
  }

  if (typeof value === "string") {
    const decimal = Number(value);
    if (!Number.isNaN(decimal)) return decimal;
    return parseInt(value, 16);
  }

  return 0;
}

async function getReserveBalance(
  connection: Connection,
  reserveAddress: PublicKey,
  programId: PublicKey,
): Promise<number> {
  try {
    const account = await getAccount(
      connection,
      reserveAddress,
      "confirmed",
      programId,
    );
    return Number(account.amount);
  } catch (error) {
    console.warn(`Could not read reserve ${reserveAddress.toBase58()}:`, error);
    return 0;
  }
}

export async function getPoolReservesHandler({
  tokenXMint,
  tokenYMint,
}: GetPoolReservesInput): Promise<GetPoolReservesOutput> {
  // Normalize SOL to WSOL for pool operations
  const { normalizeTokenMintForPool } = await import("../../utils/solana");
  const normalizedTokenXMint = normalizeTokenMintForPool(tokenXMint);
  const normalizedTokenYMint = normalizeTokenMintForPool(tokenYMint);

  const helius = getHelius();
  const connection = helius.connection;

  const emptyResult: GetPoolReservesOutput = {
    exists: false,
    lpMint: "",
    reserveX: 0,
    reserveY: 0,
    totalLpSupply: 0,
  };

  try {
    const poolData = await getPoolOnChain(normalizedTokenXMint, normalizedTokenYMint);
    if (!poolData) {
      return emptyResult;
    }

    const lpTokenMint = await getLpTokenMint(normalizedTokenXMint, normalizedTokenYMint);
    const totalLpSupplyRaw = toNumber(poolData.token_lp_supply);
    const totalLpSupply = totalLpSupplyRaw / 10 ** LP_TOKEN_DECIMALS;

    const tokenXProgramId = await detectTokenProgram(
      connection,
      new PublicKey(normalizedTokenXMint),
    );
    const tokenYProgramId = await detectTokenProgram(
      connection,
      new PublicKey(normalizedTokenYMint),
    );

    const tokenXMintInfo = await getMint(
      connection,
      new PublicKey(normalizedTokenXMint),
      "confirmed",
      tokenXProgramId,
    );
    const tokenYMintInfo = await getMint(
      connection,
      new PublicKey(normalizedTokenYMint),
      "confirmed",
      tokenYProgramId,
    );

    const reserveXAccountInfo = await connection.getAccountInfo(
      poolData.reserve_x,
    );
    const reserveYAccountInfo = await connection.getAccountInfo(
      poolData.reserve_y,
    );

    if (!reserveXAccountInfo || !reserveYAccountInfo) {
      return { ...emptyResult, lpMint: lpTokenMint.toBase58() };
    }

    const totalReserveXRaw = await getReserveBalance(
      connection,
      poolData.reserve_x,
      reserveXAccountInfo.owner,
    );
    const totalReserveYRaw = await getReserveBalance(
      connection,
      poolData.reserve_y,
      reserveYAccountInfo.owner,
    );

    const availableReserveXRaw =
      totalReserveXRaw -
      toNumber(poolData.protocol_fee_x) -
      toNumber(poolData.user_locked_x);

    const availableReserveYRaw =
      totalReserveYRaw -
      toNumber(poolData.protocol_fee_y) -
      toNumber(poolData.user_locked_y);

    const reserveX = availableReserveXRaw / 10 ** tokenXMintInfo.decimals;
    const reserveY = availableReserveYRaw / 10 ** tokenYMintInfo.decimals;

    const result: GetPoolReservesOutput = {
      exists: true,
      lpMint: lpTokenMint.toBase58(),
      protocolFeeX: toNumber(poolData.protocol_fee_x),
      protocolFeeY: toNumber(poolData.protocol_fee_y),
      reserveX: Number.isFinite(reserveX) && reserveX >= 0 ? reserveX : 0,
      reserveXRaw: availableReserveXRaw,
      reserveY: Number.isFinite(reserveY) && reserveY >= 0 ? reserveY : 0,
      reserveYRaw: availableReserveYRaw,
      totalLpSupply:
        Number.isFinite(totalLpSupply) && totalLpSupply >= 0
          ? totalLpSupply
          : 0,
      totalLpSupplyRaw,
      totalReserveXRaw,
      totalReserveYRaw,
      userLockedX: toNumber(poolData.user_locked_x),
      userLockedY: toNumber(poolData.user_locked_y),
    };

    return result;
  } catch (error) {
    console.error("Error fetching pool reserves:", error);
    return emptyResult;
  }
}
