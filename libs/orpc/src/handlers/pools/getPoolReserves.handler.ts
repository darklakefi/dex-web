"use server";
import { BN } from "@coral-xyz/anchor";
import { getPoolTokenAddress } from "@dex-web/utils";
import { getAccount } from "@solana/spl-token";
import type { Connection, PublicKey } from "@solana/web3.js";
import { Decimal } from "decimal.js";
import { getHelius } from "../../getHelius";
import type {
  GetPoolReservesInput,
  GetPoolReservesOutput,
} from "../../schemas/pools/getPoolReserves.schema";
import { getPoolOnChain } from "../../utils/solana";

function bnToNumberWithDecimals(bn: BN, decimals: number): number {
  const result = new Decimal(bn.toString()).div(new Decimal(10).pow(decimals));
  return result.toNumber();
}

/**
 * Converts a BN to a string representation for safe BigInt conversion.
 * Raw token amounts can exceed JavaScript's MAX_SAFE_INTEGER,
 * so we return them as strings to preserve precision.
 */
function bnToString(bn: BN): string {
  return bn.toString();
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
  tokenXMint: inputTokenXMint,
  tokenYMint: inputTokenYMint,
}: GetPoolReservesInput): Promise<GetPoolReservesOutput> {
  const tokenXMint = getPoolTokenAddress(inputTokenXMint);
  const tokenYMint = getPoolTokenAddress(inputTokenYMint);

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

    if (!reserveXAccountInfo || !reserveYAccountInfo) {
      return { ...emptyResult, lpMint: lpTokenMint.toBase58() };
    }

    let totalReserveXRaw: BN;
    let totalReserveYRaw: BN;

    try {
      totalReserveXRaw = await getReserveBalance(
        connection,
        poolData.reserve_x,
        reserveXAccountInfo.owner,
      );
    } catch {
      totalReserveXRaw = new BN(0);
    }

    try {
      totalReserveYRaw = await getReserveBalance(
        connection,
        poolData.reserve_y,
        reserveYAccountInfo.owner,
      );
    } catch {
      totalReserveYRaw = new BN(0);
    }

    const availableReserveXRaw = totalReserveXRaw
      .sub(poolData.protocol_fee_x)
      .sub(poolData.user_locked_x);

    const availableReserveYRaw = totalReserveYRaw
      .sub(poolData.protocol_fee_y)
      .sub(poolData.user_locked_y);

    const reserveX = availableReserveXRaw.isNeg()
      ? 0
      : bnToNumberWithDecimals(availableReserveXRaw, tokenXMintInfo.decimals);
    const reserveY = availableReserveYRaw.isNeg()
      ? 0
      : bnToNumberWithDecimals(availableReserveYRaw, tokenYMintInfo.decimals);

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
      reserveXRaw: availableReserveXRaw.isNeg()
        ? "0"
        : bnToString(availableReserveXRaw),
      reserveY,
      reserveYRaw: availableReserveYRaw.isNeg()
        ? "0"
        : bnToString(availableReserveYRaw),
      totalLpSupply,
      totalLpSupplyRaw: bnToString(poolData.token_lp_supply),
      totalReserveXRaw: bnToString(totalReserveXRaw),
      totalReserveYRaw: bnToString(totalReserveYRaw),
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
