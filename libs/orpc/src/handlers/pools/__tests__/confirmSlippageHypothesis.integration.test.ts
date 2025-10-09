/*
  Integration test: confirms/falsifies the numeric propagation hypothesis
  by fetching on-chain state via Helius RPC, parsing pool account with
  Anchor IDL, and comparing deterministic math against the FE transformer.

  Skips automatically if Helius env is not configured.
*/

import { transformAddLiquidityInput } from "@dex-web/utils";
import {
  getAccount,
  getMint,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { describe, expect, it } from "vitest";
import { getHelius } from "../../../getHelius";
import { getPoolOnChain, LP_TOKEN_DECIMALS } from "../../../utils/solana";

const hasHelius = !!process.env.HELIUS_API_KEY;

function toBigInt(value: unknown): bigint {
  if (!value) return 0n;
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") return BigInt(value);
  if (typeof value === "object" && value && "toString" in value) {
    return BigInt((value as any).toString());
  }
  return 0n;
}

async function detectTokenProgram(mint: PublicKey) {
  const helius = getHelius();
  try {
    await getMint(helius.connection, mint, "confirmed", TOKEN_PROGRAM_ID);
    return TOKEN_PROGRAM_ID;
  } catch {
    try {
      await getMint(
        helius.connection,
        mint,
        "confirmed",
        TOKEN_2022_PROGRAM_ID,
      );
      return TOKEN_2022_PROGRAM_ID;
    } catch {
      return TOKEN_PROGRAM_ID;
    }
  }
}

describe.skipIf(!hasHelius)("Confirm slippage hypothesis (on-chain)", () => {
  it("fetches on-chain state and verifies FE max amounts cover required amounts", async () => {
    const tokenXMint = new PublicKey(
      "DdLxrGFs2sKYbbqVk76eVx9268ASUdTMAhrsqphqDuX",
    );
    const tokenYMint = new PublicKey(
      "HXsKnhXPtGr2mq4uTpxbxyy7ZydYWJwx4zMuYPEDukY",
    );

    const helius = getHelius();
    const pool = await getPoolOnChain(
      tokenXMint.toBase58(),
      tokenYMint.toBase58(),
    );
    if (!pool) throw new Error("Pool not found on-chain");

    const tokenXDecimals = (
      await getMint(
        helius.connection,
        tokenXMint,
        "confirmed",
        await detectTokenProgram(tokenXMint),
      )
    ).decimals;

    const tokenYDecimals = (
      await getMint(
        helius.connection,
        tokenYMint,
        "confirmed",
        await detectTokenProgram(tokenYMint),
      )
    ).decimals;

    const reserveXInfo = await helius.connection.getAccountInfo(pool.reserve_x);
    const reserveYInfo = await helius.connection.getAccountInfo(pool.reserve_y);
    if (!reserveXInfo || !reserveYInfo)
      throw new Error("Reserve accounts missing");

    const tokenXProgram = await detectTokenProgram(tokenXMint);
    const tokenYProgram = await detectTokenProgram(tokenYMint);

    const reserveXAcc = await getAccount(
      helius.connection,
      pool.reserve_x,
      "confirmed",
      tokenXProgram,
    );
    const reserveYAcc = await getAccount(
      helius.connection,
      pool.reserve_y,
      "confirmed",
      tokenYProgram,
    );

    const totalReserveX = BigInt(reserveXAcc.amount);
    const totalReserveY = BigInt(reserveYAcc.amount);
    const protocolFeeX = toBigInt((pool as any).protocol_fee_x);
    const protocolFeeY = toBigInt((pool as any).protocol_fee_y);
    const userLockedX = toBigInt((pool as any).user_locked_x);
    const userLockedY = toBigInt((pool as any).user_locked_y);
    const totalLpSupply = toBigInt((pool as any).token_lp_supply);

    const availableX = totalReserveX - protocolFeeX - userLockedX;
    const availableY = totalReserveY - protocolFeeY - userLockedY;

    // Deterministic inputs from issue report
    const userInput = {
      slippage: "0.5",
      tokenAAmount: "1791529406.3984",
      tokenADecimals: 6,
      tokenBAmount: "7893788.293102973",
      tokenBDecimals: 9,
    } as const;

    const payload = transformAddLiquidityInput({
      poolReserves: {
        lockedX: userLockedX,
        lockedY: userLockedY,
        protocolFeeX,
        protocolFeeY,
        reserveX: availableX,
        reserveY: availableY,
        totalLpSupply,
        userLockedX,
        userLockedY,
      },
      slippage: userInput.slippage,
      tokenAAddress: tokenXMint.toBase58(),
      tokenAAmount: userInput.tokenAAmount,
      tokenADecimals: userInput.tokenADecimals,
      tokenBAddress: tokenYMint.toBase58(),
      tokenBAmount: userInput.tokenBAmount,
      tokenBDecimals: userInput.tokenBDecimals,
      userAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    });

    // Compute required amounts from LP using CEILING and on-chain available reserves
    const lp = payload.amountLp;
    const supply = totalLpSupply;
    const reqX = (() => {
      let v = (lp * availableX) / supply;
      if ((lp * availableX) % supply > 0n && v > 0n) v += 1n;
      return v;
    })();
    const reqY = (() => {
      let v = (lp * availableY) / supply;
      if ((lp * availableY) % supply > 0n && v > 0n) v += 1n;
      return v;
    })();

    // Assert payload max amounts cover the required amounts
    expect(payload.maxAmountX).toBeGreaterThanOrEqual(reqX);
    expect(payload.maxAmountY).toBeGreaterThanOrEqual(reqY);

    // Log digest for visibility
    // eslint-disable-next-line no-console
    console.log("TX Math Digest", {
      availableX: availableX.toString(),
      availableY: availableY.toString(),
      LP_TOKEN_DECIMALS,
      lpMinted: lp.toString(),
      maxX: payload.maxAmountX.toString(),
      maxY: payload.maxAmountY.toString(),
      protocolFeeX: protocolFeeX.toString(),
      protocolFeeY: protocolFeeY.toString(),
      requiredX: reqX.toString(),
      requiredY: reqY.toString(),
      tokenXDecimals,
      tokenYDecimals,
      totalLpSupply: totalLpSupply.toString(),
      totalReserveX: totalReserveX.toString(),
      totalReserveY: totalReserveY.toString(),
    });
  }, 60_000);
});
