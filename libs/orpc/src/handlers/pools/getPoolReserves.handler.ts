"use server";
import { getLpTokenMint } from "@dex-web/core";
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
/**
 * Get pool reserves and LP token information.
 * Returns available reserves (total reserves minus locked amounts and protocol fees)
 * in human-readable units.
 */
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
    // Calculate available reserves (total - user locked - locked - protocol fees)
    // This matches the SDK's calculation for available liquidity
    // See @darklakefi/ts-sdk-on-chain math.ts quote() function
    // BN objects have a toNumber() method that should be used
    const toNum = (val: any): number => {
      if (!val) return 0;
      if (typeof val === "number") return val;
      // BN object has toNumber() method
      if (typeof val.toNumber === "function") return val.toNumber();
      if (typeof val === "string") {
        // Try parsing as regular number first
        const num = Number(val);
        if (!Number.isNaN(num)) return num;
        // If that fails, it might be hex
        return parseInt(val, 16);
      }
      return 0;
    };

    const availableReserveX =
      reserveXBalance -
      toNum(poolData.user_locked_x) -
      toNum(poolData.locked_x) -
      toNum(poolData.protocol_fee_x);
    const availableReserveY =
      reserveYBalance -
      toNum(poolData.user_locked_y) -
      toNum(poolData.locked_y) -
      toNum(poolData.protocol_fee_y);

    const reserveX = availableReserveX / 10 ** tokenXMintInfo.decimals;
    const reserveY = availableReserveY / 10 ** tokenYMintInfo.decimals;
    const safeReserveX =
      Number.isNaN(reserveX) || !Number.isFinite(reserveX) || reserveX < 0
        ? 0
        : reserveX;
    const safeReserveY =
      Number.isNaN(reserveY) || !Number.isFinite(reserveY) || reserveY < 0
        ? 0
        : reserveY;
    const safeTotalLpSupply =
      Number.isNaN(totalLpSupply) || !Number.isFinite(totalLpSupply)
        ? 0
        : totalLpSupply;

    // Debug logging - show both raw and converted values
    console.log("Pool Reserves Calculation:", {
      availableReserveX: safeReserveX,
      availableReserveXRaw: availableReserveX,
      availableReserveY: safeReserveY,
      availableReserveYRaw: availableReserveY,
      lockedX_num: toNum(poolData.locked_x),
      lockedX_raw: poolData.locked_x,
      lockedY_num: toNum(poolData.locked_y),
      lockedY_raw: poolData.locked_y,
      protocolFeeX_num: toNum(poolData.protocol_fee_x),
      protocolFeeX_raw: poolData.protocol_fee_x,
      protocolFeeY_num: toNum(poolData.protocol_fee_y),
      protocolFeeY_raw: poolData.protocol_fee_y,
      tokenXMint,
      tokenYMint,
      totalLpSupply: safeTotalLpSupply,
      totalReserveX: reserveXBalance,
      totalReserveY: reserveYBalance,
      userLockedX_num: toNum(poolData.user_locked_x),
      userLockedX_raw: poolData.user_locked_x,
      userLockedY_num: toNum(poolData.user_locked_y),
      userLockedY_raw: poolData.user_locked_y,
    });

    const result = {
      exists: true,
      lpMint: lpTokenMintString,
      reserveX: safeReserveX,
      reserveY: safeReserveY,
      totalLpSupply: safeTotalLpSupply,
    };
    return result;
  } catch (_error) {
    return {
      exists: false,
      lpMint: "",
      reserveX: 0,
      reserveY: 0,
      totalLpSupply: 0,
    };
  }
}
