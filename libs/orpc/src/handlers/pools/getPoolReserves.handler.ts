"use server";
import { getLpTokenMint } from "@dex-web/core";
import {
  getAccount,
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { type Connection, PublicKey } from "@solana/web3.js";
import { Decimal } from "decimal.js";
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
 * Safely convert BN or number to BigInt without precision loss.
 */
function toBigInt(value: unknown): bigint {
  if (!value) return 0n;
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);

  // Handle Anchor BN type
  if (
    typeof value === "object" &&
    "toString" in value &&
    typeof value.toString === "function"
  ) {
    return BigInt(value.toString());
  }

  if (typeof value === "string") {
    return BigInt(value);
  }

  return 0n;
}

async function getReserveBalance(
  connection: Connection,
  reserveAddress: PublicKey,
  programId: PublicKey,
): Promise<bigint> {
  try {
    const account = await getAccount(
      connection,
      reserveAddress,
      "confirmed",
      programId,
    );
    // spl-token getAccount returns amount as bigint; keep it precise
    return BigInt(account.amount);
  } catch (error) {
    console.warn(`Could not read reserve ${reserveAddress.toBase58()}:`, error);
    return 0n;
  }
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
    const totalLpSupplyBigInt = toBigInt(poolData.token_lp_supply);
    // Human-readable LP supply (display only). Compute via Decimal to avoid BigInt->Number overflow.
    const totalLpSupply = new Decimal(totalLpSupplyBigInt.toString())
      .div(new Decimal(10).pow(LP_TOKEN_DECIMALS))
      .toNumber();

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

    // Use BigInt throughout to avoid JavaScript number precision loss for large integers
    const totalReserveXBigInt = totalReserveXRaw;
    const totalReserveYBigInt = totalReserveYRaw;
    const protocolFeeXBigInt = toBigInt(poolData.protocol_fee_x);
    const protocolFeeYBigInt = toBigInt(poolData.protocol_fee_y);
    const userLockedXBigInt = toBigInt(poolData.user_locked_x);
    const userLockedYBigInt = toBigInt(poolData.user_locked_y);

    const availableReserveXBigInt =
      totalReserveXBigInt - protocolFeeXBigInt - userLockedXBigInt;
    const availableReserveYBigInt =
      totalReserveYBigInt - protocolFeeYBigInt - userLockedYBigInt;

    // Keep as strings to avoid JavaScript Number precision loss
    const availableReserveXRaw = availableReserveXBigInt.toString();
    const availableReserveYRaw = availableReserveYBigInt.toString();

    // Human-readable balances computed via Decimal (display only)
    const reserveX = new Decimal(availableReserveXBigInt.toString())
      .div(new Decimal(10).pow(tokenXMintInfo.decimals))
      .toNumber();
    const reserveY = new Decimal(availableReserveYBigInt.toString())
      .div(new Decimal(10).pow(tokenYMintInfo.decimals))
      .toNumber();

    const result: GetPoolReservesOutput = {
      exists: true,
      lpMint: lpTokenMint.toBase58(),
      protocolFeeX: Number(protocolFeeXBigInt),
      protocolFeeXRaw: protocolFeeXBigInt.toString(),
      protocolFeeY: Number(protocolFeeYBigInt),
      protocolFeeYRaw: protocolFeeYBigInt.toString(),
      reserveX: Number.isFinite(reserveX) && reserveX >= 0 ? reserveX : 0,
      reserveXRaw: availableReserveXRaw,
      reserveY: Number.isFinite(reserveY) && reserveY >= 0 ? reserveY : 0,
      reserveYRaw: availableReserveYRaw,
      totalLpSupply:
        Number.isFinite(totalLpSupply) && totalLpSupply >= 0
          ? totalLpSupply
          : 0,
      totalLpSupplyRaw: totalLpSupplyBigInt.toString(),
      totalReserveXRaw: totalReserveXBigInt.toString(),
      totalReserveYRaw: totalReserveYBigInt.toString(),
      userLockedX: Number(userLockedXBigInt),
      userLockedXRaw: userLockedXBigInt.toString(),
      userLockedY: Number(userLockedYBigInt),
      userLockedYRaw: userLockedYBigInt.toString(),
    };

    console.log("✅ Pool Reserves Handler Result:");
    console.log("📊 TOTAL Reserves (pool_token_reserve_x.amount on-chain):", {
      totalReserveXRaw: totalReserveXBigInt.toString(),
      totalReserveYRaw: totalReserveYBigInt.toString(),
    });
    console.log("📊 Fees to subtract:", {
      protocolFeeX: protocolFeeXBigInt.toString(),
      protocolFeeY: protocolFeeYBigInt.toString(),
      userLockedX: userLockedXBigInt.toString(),
      userLockedY: userLockedYBigInt.toString(),
    });
    console.log("📊 AVAILABLE Reserves (after subtracting fees):", {
      availableReserveXRaw: availableReserveXRaw.toString(),
      availableReserveYRaw: availableReserveYRaw.toString(),
      xDiff: (totalReserveXBigInt - BigInt(availableReserveXRaw)).toString(),
      yDiff: (totalReserveYBigInt - BigInt(availableReserveYRaw)).toString(),
    });
    console.log("📊 LP Supply:", {
      note: "from pool.token_lp_supply (NOT LP mint supply!)",
      totalLpSupply: result.totalLpSupply?.toString() ?? "0",
      totalLpSupplyRaw: result.totalLpSupplyRaw?.toString() ?? "0",
    });
    console.log("🔍 Rust comparison:");
    console.log("  add_liquidity.rs:123-135 calculates:");
    console.log(
      "    total_token_x_amount = pool_token_reserve_x.amount - protocol_fee_x - user_locked_x",
    );
    console.log(
      "    total_token_y_amount = pool_token_reserve_y.amount - protocol_fee_y - user_locked_y",
    );
    console.log(
      "  We return reserveXRaw/reserveYRaw as AVAILABLE (matching Rust calculation)",
    );
    console.log("✅ Token decimals:", {
      tokenXDecimals: tokenXMintInfo.decimals,
      tokenYDecimals: tokenYMintInfo.decimals,
    });

    return result;
  } catch (error) {
    console.error("Error fetching pool reserves:", error);
    return emptyResult;
  }
}
