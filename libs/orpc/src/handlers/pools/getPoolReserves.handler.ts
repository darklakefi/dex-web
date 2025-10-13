"use server";
import { BN } from "@coral-xyz/anchor";
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

function bnToNumberWithDecimals(bn: BN, decimals: number): number {
  const str = bn.toString();
  const len = str.length;

  if (len <= decimals) {
    const padded = str.padStart(decimals + 1, "0");
    const result = Number(`0.${padded.slice(1)}`);
    return Number.isFinite(result) && result >= 0 ? result : 0;
  }

  const integerPart = str.slice(0, len - decimals);
  const decimalPart = str.slice(len - decimals);
  const result = Number(`${integerPart}.${decimalPart}`);

  return Number.isFinite(result) && result >= 0 ? result : 0;
}

function bnToSafeNumber(bn: BN): number {
  const str = bn.toString();
  const num = Number(str);

  if (
    !Number.isFinite(num) ||
    num > Number.MAX_SAFE_INTEGER ||
    num < Number.MIN_SAFE_INTEGER
  ) {
    console.warn(
      `Value ${str} exceeds safe JavaScript number range, clamping to MAX_SAFE_INTEGER`,
    );
    return Number.MAX_SAFE_INTEGER;
  }

  return num >= 0 ? num : 0;
}

async function getReserveBalance(
  connection: Connection,
  reserveAddress: PublicKey,
  programId: PublicKey,
): Promise<BN> {
  const account = await getAccount(
    connection,
    reserveAddress,
    "confirmed",
    programId,
  );
  return new BN(account.amount.toString());
}

export async function getPoolReservesHandler({
  tokenXMint,
  tokenYMint,
}: GetPoolReservesInput): Promise<GetPoolReservesOutput> {
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
    const poolData = await getPoolOnChain(tokenXMint, tokenYMint);
    if (!poolData) {
      return emptyResult;
    }

    const lpTokenMint = await getLpTokenMint(tokenXMint, tokenYMint);
    const totalLpSupply = bnToNumberWithDecimals(
      poolData.token_lp_supply,
      LP_TOKEN_DECIMALS,
    );

    const tokenXProgramId = await detectTokenProgram(
      connection,
      new PublicKey(tokenXMint),
    );
    const tokenYProgramId = await detectTokenProgram(
      connection,
      new PublicKey(tokenYMint),
    );

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

    const availableReserveXRaw = totalReserveXRaw
      .sub(poolData.protocol_fee_x)
      .sub(poolData.user_locked_x);

    const availableReserveYRaw = totalReserveYRaw
      .sub(poolData.protocol_fee_y)
      .sub(poolData.user_locked_y);

    const reserveX = bnToNumberWithDecimals(
      availableReserveXRaw,
      tokenXMintInfo.decimals,
    );
    const reserveY = bnToNumberWithDecimals(
      availableReserveYRaw,
      tokenYMintInfo.decimals,
    );

    const result: GetPoolReservesOutput = {
      exists: true,
      lpMint: lpTokenMint.toBase58(),
      protocolFeeX: bnToNumberWithDecimals(
        poolData.protocol_fee_x,
        tokenXMintInfo.decimals,
      ),
      protocolFeeY: bnToNumberWithDecimals(
        poolData.protocol_fee_y,
        tokenYMintInfo.decimals,
      ),
      reserveX,
      reserveXRaw: bnToSafeNumber(availableReserveXRaw),
      reserveY,
      reserveYRaw: bnToSafeNumber(availableReserveYRaw),
      totalLpSupply,
      totalLpSupplyRaw: bnToSafeNumber(poolData.token_lp_supply),
      totalReserveXRaw: bnToSafeNumber(totalReserveXRaw),
      totalReserveYRaw: bnToSafeNumber(totalReserveYRaw),
      userLockedX: bnToNumberWithDecimals(
        poolData.user_locked_x,
        tokenXMintInfo.decimals,
      ),
      userLockedY: bnToNumberWithDecimals(
        poolData.user_locked_y,
        tokenYMintInfo.decimals,
      ),
    };

    return result;
  } catch (error) {
    console.error("Error fetching pool reserves:", error);
    return emptyResult;
  }
}
