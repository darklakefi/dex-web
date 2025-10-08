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

/**
 * Detect which token program (Token or Token-2022) a mint uses
 */
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
 * Safely convert BN/Buffer/string to number
 */
function toNumber(value: unknown): number {
  if (!value) return 0;
  if (typeof value === "number") return value;

  // BN object
  if (
    typeof value === "object" &&
    "toNumber" in value &&
    typeof value.toNumber === "function"
  ) {
    return value.toNumber();
  }

  // String (could be hex or decimal)
  if (typeof value === "string") {
    const decimal = Number(value);
    if (!Number.isNaN(decimal)) return decimal;
    return parseInt(value, 16);
  }

  return 0;
}

/**
 * Get reserve balance from token account
 */
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

/**
 * Get pool reserves and LP token information.
 * Returns available reserves (total reserves minus locked amounts and protocol fees)
 * in both raw units and human-readable format.
 */
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
    // Step 1: Get pool account data
    const poolData = await getPoolOnChain(tokenXMint, tokenYMint);
    if (!poolData) {
      return emptyResult;
    }

    // Step 2: Get LP token supply from POOL ACCOUNT (not LP mint!)
    // CRITICAL: The on-chain program uses pool.token_lp_supply (add_liquidity.rs:163)
    // NOT the LP mint's total supply. These can differ!
    const lpTokenMint = await getLpTokenMint(tokenXMint, tokenYMint);
    const totalLpSupplyRaw = toNumber(poolData.token_lp_supply); // From Pool account!
    const totalLpSupply = totalLpSupplyRaw / 10 ** LP_TOKEN_DECIMALS;

    // Step 3: Get token mint info (for decimals)
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

    // Step 4: Get reserve account info (to detect program)
    const reserveXAccountInfo = await connection.getAccountInfo(
      poolData.reserve_x,
    );
    const reserveYAccountInfo = await connection.getAccountInfo(
      poolData.reserve_y,
    );

    if (!reserveXAccountInfo || !reserveYAccountInfo) {
      return { ...emptyResult, lpMint: lpTokenMint.toBase58() };
    }

    // Step 5: Get reserve balances (raw units)
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

    // Step 6: Calculate available reserves (raw units)
    // CRITICAL: Match EXACTLY what add_liquidity.rs:149-157 does:
    // total_token_x_amount = reserve.amount - protocol_fee_x - user_locked_x
    // Note: It does NOT subtract locked_x! Only user_locked_x and protocol_fee_x
    const availableReserveXRaw =
      totalReserveXRaw -
      toNumber(poolData.protocol_fee_x) -
      toNumber(poolData.user_locked_x);

    const availableReserveYRaw =
      totalReserveYRaw -
      toNumber(poolData.protocol_fee_y) -
      toNumber(poolData.user_locked_y);

    // Step 7: Convert to human-readable units
    const reserveX = availableReserveXRaw / 10 ** tokenXMintInfo.decimals;
    const reserveY = availableReserveYRaw / 10 ** tokenYMintInfo.decimals;

    // CRITICAL: Use AVAILABLE reserves (not total) for LP calculations!
    // From add_liquidity.rs lines 149-157, the on-chain program uses:
    // total_token_x_amount = reserve_x.amount - protocol_fee_x - user_locked_x
    // This is AVAILABLE reserves, not TOTAL reserves.
    // The program then calculates required amounts using lp_tokens_to_trading_tokens()
    // with these AVAILABLE reserves.

    const result: GetPoolReservesOutput = {
      exists: true,
      lpMint: lpTokenMint.toBase58(),
      reserveX: Number.isFinite(reserveX) && reserveX >= 0 ? reserveX : 0,
      reserveXRaw: availableReserveXRaw, // Use AVAILABLE (matches on-chain program!)
      reserveY: Number.isFinite(reserveY) && reserveY >= 0 ? reserveY : 0,
      reserveYRaw: availableReserveYRaw, // Use AVAILABLE (matches on-chain program!)
      totalLpSupply:
        Number.isFinite(totalLpSupply) && totalLpSupply >= 0
          ? totalLpSupply
          : 0,
      totalLpSupplyRaw,
    };

    console.log("✅ Pool Reserves Handler Result:", {
      availableReserveXRaw,
      availableReserveYRaw,
      difference: {
        xDiff: totalReserveXRaw - availableReserveXRaw,
        yDiff: totalReserveYRaw - availableReserveYRaw,
      },
      lpSupplyNote:
        "totalLpSupplyRaw is from pool.token_lp_supply (NOT LP mint supply!)",
      note: "⚠️ CRITICAL: reserveXRaw/reserveYRaw = AVAILABLE reserves (matches add_liquidity.rs:149-157)",
      poolTokenLpSupply: poolData.token_lp_supply,
      returnedReserveXRaw: result.reserveXRaw,
      returnedReserveYRaw: result.reserveYRaw,
      rustSource:
        "add_liquidity.rs:163 uses pool.token_lp_supply for calculations",
      tokenXDecimals: tokenXMintInfo.decimals,
      tokenXMint,
      tokenYDecimals: tokenYMintInfo.decimals,
      tokenYMint,
      totalLpSupply: result.totalLpSupply,
      totalLpSupplyRaw: result.totalLpSupplyRaw,
      totalReserveXRaw,
      totalReserveYRaw,
      usingAvailable: true,
    });

    return result;
  } catch (error) {
    console.error("Error fetching pool reserves:", error);
    return emptyResult;
  }
}
